import {
  TransactionType,
  constants,
} from 'starknet';
import { Struct } from 'superstruct';

import type {
  Network,
  Transaction,
  TranscationAccountCall,
} from '../../types/snapState';
import { type StarkScanAccountCall, type StarkScanTransaction, type StarkScanOptions, StarkScanTransactionsResponseStruct, StarkScanTransactionsResponse } from './starkscan.type';
import type { IDataClient } from '../data-client';
import { ApiClient, HttpHeaders, HttpMethod, HttpResponse } from '../api-client';

export class StarkScanClient extends ApiClient implements IDataClient {
  apiClientName = 'StarkScanClient';

  protected limit: number = 100;

  protected network: Network;

  protected options: StarkScanOptions;

  protected deploySelectorName = 'constructor';

  constructor(network: Network, options: StarkScanOptions) {
    super();
    this.network = network;
    this.options = options;
  }

  protected get baseUrl(): string {
    switch (this.network.chainId) {
      case constants.StarknetChainId.SN_SEPOLIA:
        return 'https://api-sepolia.starkscan.co/api/v0';
      case constants.StarknetChainId.SN_MAIN:
        return 'https://api.starkscan.co/api/v0';
      default:
        throw new Error(`Invalid Network`);
    }
  }

  protected getApiUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  protected getHttpHeaders(): HttpHeaders {
    return {
      'x-api-key': this.options.apiKey,
    };
  }

  protected async getResponse<ApiResponse>(
    response: HttpResponse,
  ): Promise<ApiResponse> {
    // For successful requests, Simplehash will return a 200 status code.
    // Any other status code should be considered an error.
    if (response.status !== 200) {
      throw new Error(`API response error`);
    }

    return await super.getResponse<ApiResponse>(response);
  }

  protected async submitGetApiRequest<ApiResponse>({
    apiUrl,
    responseStruct,
    requestName,
  }: {
    apiUrl: string;
    responseStruct: Struct;
    requestName: string;
  }): Promise<ApiResponse> {
    return await super.submitHttpRequest<ApiResponse>({
      request: this.buildHttpRequest({
        method: HttpMethod.Get,
        url: this.getApiUrl(apiUrl),
        headers: this.getHttpHeaders(),
      }),
      responseStruct,
      requestName,
    });
  }

  /**
   * Fetches the transactions for a given contract address.
   * The transactions are fetched in descending order and it will include the deploy transaction.
   *
   * @param address - The address of the contract to fetch the transactions for.
   * @param to - The timestamp to fetch the transactions until.
   * @returns A Promise that resolve an array of Transaction object.
   */
  async getTransactions(
    address: string,
    to: number,
  ): Promise<Transaction[]> {
    let apiUrl = this.getApiUrl(`/transactions?contract_address=${address}&order_by=desc&limit=${this.limit}`);

    const txs: Transaction[] = [];
    let deployTxFound = false;
    let process = true;
    let timestamp = 0;

    // Scan the transactions in descending order by timestamp
    // Include the transaction if:
    // - it's timestamp is greater than the `tillTo` AND
    // - there is an next data to fetch
    while (process && (timestamp === 0 || timestamp >= to)) {
      process = false;

      const result = await this.submitGetApiRequest<StarkScanTransactionsResponse>({
        apiUrl,
        responseStruct: StarkScanTransactionsResponseStruct,
        requestName: 'getTransactions',
      });

      for (const data of result.data) {
        const tx = this.toTransaction(data);
        const isDeployTx = this.isDeployTransaction(data);

        if (isDeployTx) {
          deployTxFound = true;
        }

        timestamp = tx.timestamp;
        // If the timestamp is smaller than the `tillTo`
        // We don't need those records
        // But if the record is an deploy transaction, we should include it to reduce the number of requests
        if (timestamp >= to || isDeployTx) {
          txs.push(tx);
        }
      }

      if (result.next_url) {
        apiUrl = result.next_url;
        process = true;
      }
    }

    // If no deploy transaction found,
    // we scan the transactions in asc order by timestamp, as deploy transaction is usually the first transaction
    if (!deployTxFound) {
      const deployTx = await this.getDeployTransaction(address);
      deployTx && txs.push(deployTx);
    }

    return txs;
  }

  /**
   * Fetches the deploy transaction for a given contract address.
   *
   * @param address - The address of the contract to fetch the deploy transaction for.
   * @returns A Promise that resolve the Transaction object or null if the transaction can not be found.
   */
  async getDeployTransaction(address: string): Promise<Transaction | null> {
    // Fetch the first 5 transactions to find the deploy transaction
    // The deploy transaction usually is the first transaction from the list
    const apiUrl = this.getApiUrl(`/transactions?contract_address=${address}&order_by=asc&limit=5`);

    const result = await this.submitGetApiRequest<StarkScanTransactionsResponse>({
      apiUrl,
      responseStruct: StarkScanTransactionsResponseStruct,
      requestName: 'getTransactions'
    });

    for (const data of result.data) {
      if (this.isDeployTransaction(data)) {
        return this.toTransaction(data);
      }
    }

    return null;
  }

  protected isDeployTransaction(tx: StarkScanTransaction): boolean {
    return tx.transaction_type === TransactionType.DEPLOY_ACCOUNT;
  }

  protected isFundTransferTransaction(entrypoint: string): boolean {
    return entrypoint === 'transfer';
  }

  protected getContractAddress(tx: StarkScanTransaction): string {
    // backfill the contract address if it is null
    return tx.contract_address ?? '';
  }

  protected getSenderAddress(tx: StarkScanTransaction): string {
    let sender = tx.sender_address;

    if (this.isDeployTransaction(tx)) {
      // if it is a deploy transaction, the contract address is the sender address
      sender = tx.contract_address as unknown as string;
    }

    // backfill the sender address if it is null
    return sender ?? '';
  }

  protected toTransaction(tx: StarkScanTransaction): Transaction {
    /* eslint-disable @typescript-eslint/naming-convention */

    const {
      transaction_hash: txnHash,
      transaction_type: txnType,
      timestamp,
      transaction_finality_status: finalityStatus,
      transaction_execution_status: executionStatus,
      max_fee: maxFee,
      actual_fee: actualFee,
      revert_error: failureReason,
      account_calls: calls
    } = tx;

    // account_calls representing the calls to invoke from the account contract, it can be multiple
    // If the transaction is a deploy transaction, the account_calls is a empty array
    const accountCalls = this.toAccountCall(calls);

    return {
      txnHash,
      txnType,
      chainId: this.network.chainId,
      senderAddress: this.getSenderAddress(tx),
      timestamp,
      finalityStatus,
      executionStatus,
      maxFee,
      actualFee,
      contractAddress: this.getContractAddress(tx),
      accountCalls,
      // the entry point selector name is moved to accountCalls
      contractFuncName: '',
      // the account call data is moved to accountCalls
      contractCallData: [],
      failureReason: failureReason ?? '',
    };

    /* eslint-enable */
  }

  protected toAccountCall(
    calls: StarkScanAccountCall[],
  ): Record<string, TranscationAccountCall[]> | null {
    if (!calls || calls.length === 0) {
      return null;
    }

    return calls.reduce(
      (
        data: Record<string, TranscationAccountCall[]>,
        accountCallArg: StarkScanAccountCall,
      ) => {
        const {
          contract_address: contract,
          selector_name: contractFuncName,
          calldata: contractCallData,
        } = accountCallArg;

        if (!Object.prototype.hasOwnProperty.call(data, contract)) {
          data[contract] = [];
        }

        const accountCall: TranscationAccountCall = {
          contract,
          contractFuncName,
          contractCallData,
        };

        if (this.isFundTransferTransaction(contractFuncName)) {
          accountCall.recipient = accountCallArg.calldata[0];
          accountCall.amount = accountCallArg.calldata[1];
        }

        data[contract].push(accountCall);

        return data;
      },
      {},
    );
  }
}
