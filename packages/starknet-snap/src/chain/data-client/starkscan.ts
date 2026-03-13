import { TransactionType, constants } from 'starknet';
import type { Struct } from 'superstruct';

import type { TransactionsCursor, V2Transaction } from '../../types/snapState';
import { type Network, type Transaction } from '../../types/snapState';
import { InvalidNetworkError } from '../../utils/exceptions';
import {
  newDeployTransaction,
  newInvokeTransaction,
} from '../../utils/transaction';
import type { HttpHeaders } from '../api-client';
import { ApiClient, HttpMethod } from '../api-client';
import type { IDataClient } from '../data-client';
import type { StarkScanTransactionsResponse } from './starkscan.type';
import {
  type StarkScanTransaction,
  type StarkScanOptions,
  StarkScanTransactionsResponseStruct,
} from './starkscan.type';

export class StarkScanClient extends ApiClient implements IDataClient {
  apiClientName = 'StarkScanClient';

  protected limit = 10;

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
   * Transactions are retrieved in descending order for pagination.
   *
   * @param address - The contract address to fetch transactions for.
   * @param cursor - Optional pagination cursor.
   * @param cursor.blockNumber - The block number for pagination.
   * @param cursor.txnHash - The transaction hash for pagination.
   * @returns A Promise resolving to an object with transactions and a pagination cursor.
   */
  async getTransactions(
    address: string,
    cursor?: { blockNumber: number; txnHash: string },
  ): Promise<{ transactions: Transaction[]; cursor: TransactionsCursor }> {
    let apiUrl = this.getApiUrl(
      `/transactions?contract_address=${address}&order_by=desc&limit=${this.limit}`,
    );

    if (cursor !== undefined) {
      apiUrl += `&to_block=${cursor.blockNumber}`;
    }

    const txs: Transaction[] = [];
    let newCursor: TransactionsCursor = {
      blockNumber: -1,
      txnHash: '',
    };

    const result = await this.sendApiRequest<StarkScanTransactionsResponse>({
      apiUrl,
      responseStruct: StarkScanTransactionsResponseStruct,
      requestName: 'getTransactions',
    });

    const matchingIndex = cursor
      ? result.data.findIndex((txn) => txn.transaction_hash === cursor.txnHash)
      : -1;

    const startIndex = matchingIndex >= 0 ? matchingIndex + 1 : 0;
    console.log('startIndex', startIndex);
    for (let i = startIndex; i < result.data.length; i++) {
      const tx = this.toTransaction(result.data[i]);
      txs.push(tx);
    }

    if (result.data.length > 0) {
      const lastTx = result.data[result.data.length - 1];
      newCursor = {
        blockNumber: lastTx.block_number,
        txnHash: lastTx.transaction_hash,
      };
    }

    return { transactions: txs, cursor: newCursor };
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
    /* eslint-disable @typescript-eslint/naming-convention, camelcase */
    const {
      transaction_hash: txnHash,
      transaction_type: txnType,
      timestamp,
      transaction_finality_status: finalityStatus,
      transaction_execution_status: executionStatus,
      max_fee,
      actual_fee: actualFee,
      revert_error,
      // account_calls representing the calls to invoke from the account contract, it can be multiple
      // If the transaction is a deploy transaction, the account_calls is a empty array
      account_calls: calls,
      version: txnVersion,
    } = tx;

    const { chainId } = this.network;
    const senderAddress = this.getSenderAddress(tx);
    const failureReason = revert_error ?? '';
    const maxFee = max_fee ?? '0';

    let transaction: V2Transaction;

    // eslint-disable-next-line no-negated-condition
    if (!this.isDeployTransaction(tx)) {
      transaction = newInvokeTransaction({
        txnHash,
        senderAddress,
        chainId,
        maxFee,
        calls: calls.map((call) => ({
          contractAddress: call.contract_address,
          entrypoint: call.selector,
          calldata: call.calldata,
        })),
        txnVersion,
      });
    } else {
      transaction = newDeployTransaction({
        txnHash,
        senderAddress,
        chainId,
        txnVersion,
      });
    }

    return {
      ...transaction,
      // Override the fields from the StarkScanTransaction
      timestamp,
      finalityStatus,
      executionStatus,
      actualFee,
      maxFee,
      contractAddress: this.getContractAddress(tx),
      failureReason,
      txnType,
    };
    /* eslint-enable */
  }
}
