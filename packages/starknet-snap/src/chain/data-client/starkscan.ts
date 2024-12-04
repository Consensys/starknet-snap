import { TransactionType, constants } from 'starknet';
import type { Struct } from 'superstruct';

import type {
  Network,
  Transaction,
  TranscationAccountCall,
} from '../../types/snapState';
import { InvalidNetworkError } from '../../utils/exceptions';
import type { HttpHeaders } from '../api-client';
import { ApiClient, HttpMethod } from '../api-client';
import type { IDataClient } from '../data-client';
import type { StarkScanTransactionsResponse } from './starkscan.type';
import {
  type StarkScanAccountCall,
  type StarkScanTransaction,
  type StarkScanOptions,
  StarkScanTransactionsResponseStruct,
} from './starkscan.type';

export class StarkScanClient extends ApiClient implements IDataClient {
  apiClientName = 'StarkScanClient';

  protected limit = 100;

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
        throw new InvalidNetworkError();
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

  protected async sendApiRequest<ApiResponse>({
    apiUrl,
    responseStruct,
    requestName,
  }: {
    apiUrl: string;
    responseStruct: Struct;
    requestName: string;
  }): Promise<ApiResponse> {
    return await super.sendHttpRequest<ApiResponse>({
      request: this.buildHttpRequest({
        method: HttpMethod.Get,
        url: apiUrl,
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
   * @param to - The filter includes transactions with a timestamp that is >= a specified value, but the deploy transaction is always included regardless of its timestamp.
   * @returns A Promise that resolve an array of Transaction object.
   */
  async getTransactions(address: string, to: number): Promise<Transaction[]> {
    let apiUrl = this.getApiUrl(
      `/transactions?contract_address=${address}&order_by=desc&limit=${this.limit}`,
    );

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

      const result = await this.sendApiRequest<StarkScanTransactionsResponse>({
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
        // Only include the records that newer than or equal to the `to` timestamp from the same batch of result
        // If there is an deploy transaction from the result, it should included too.
        // e.g
        // to: 1000
        // [
        //   { timestamp: 1100, transaction_type: "invoke"  }, <-- include
        //   { timestamp: 900, transaction_type: "invoke" }, <-- exclude
        //   { timestamp: 100, transaction_type: "deploy" }  <-- include
        // ]
        if (timestamp >= to || isDeployTx) {
          txs.push(tx);
        }
      }

      if (result.next_url) {
        apiUrl = result.next_url;
        process = true;
      }
    }

    // In case no deploy transaction found from above,
    // then scan the transactions in asc order by timestamp,
    // the deploy transaction should usually be the first transaction from the list
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
    const apiUrl = this.getApiUrl(
      `/transactions?contract_address=${address}&order_by=asc&limit=5`,
    );

    const result = await this.sendApiRequest<StarkScanTransactionsResponse>({
      apiUrl,
      responseStruct: StarkScanTransactionsResponseStruct,
      requestName: 'getTransactions',
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
      account_calls: calls,
      version,
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
      failureReason: failureReason ?? '',
      version,
      dataVersion: 'V2',
    };

    /* eslint-enable */
  }

  protected toAccountCall(
    accountCalls: StarkScanAccountCall[],
  ): Record<string, TranscationAccountCall[]> | null {
    if (!accountCalls || accountCalls.length === 0) {
      return null;
    }

    return accountCalls.reduce(
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
