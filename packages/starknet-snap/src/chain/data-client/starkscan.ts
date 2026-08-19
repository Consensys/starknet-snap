import { TransactionType, constants } from 'starknet';
import type { Struct } from 'superstruct';

import type { V2Transaction } from '../../types/snapState';
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

  protected limit = 100;

  protected network: Network;

  protected options: StarkScanOptions;

  constructor(network: Network, options: StarkScanOptions) {
    super();
    this.network = network;
    this.options = options;
  }

  protected get chain(): string {
    switch (this.network.chainId) {
      case constants.StarknetChainId.SN_SEPOLIA:
        return 'SN_SEPOLIA';
      case constants.StarknetChainId.SN_MAIN:
        return 'SN_MAIN';
      default:
        throw new InvalidNetworkError();
    }
  }

  protected get baseUrl(): string {
    switch (this.network.chainId) {
      case constants.StarknetChainId.SN_SEPOLIA:
      case constants.StarknetChainId.SN_MAIN:
        return 'https://api.starkscan.co';
      default:
        throw new InvalidNetworkError();
    }
  }

  protected getApiUrl(address: string, cursor?: string): string {
    let url = `${this.baseUrl}/v1/${this.chain}/address/${address}/transactions?limit=${this.limit}`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    return url;
  }

  protected getHttpHeaders(): HttpHeaders {
    return {
      'X-Starkscan-Api-Key': this.options.apiKey,
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
   * The transactions are fetched newest-first and include the deploy transaction when found.
   *
   * @param address - The address of the contract to fetch the transactions for.
   * @param to - Unix timestamp; include txs at or after this time. Deploy txs are always included.
   * @returns A Promise that resolve an array of Transaction object.
   */
  async getTransactions(address: string, to: number): Promise<Transaction[]> {
    let apiUrl = this.getApiUrl(address);

    const txs: Transaction[] = [];
    let deployTxFound = false;
    let process = true;
    let timestamp = 0;

    while (process && (timestamp === 0 || timestamp >= to)) {
      process = false;

      const result = await this.sendApiRequest<StarkScanTransactionsResponse>({
        apiUrl,
        responseStruct: StarkScanTransactionsResponseStruct,
        requestName: 'getTransactions',
      });

      for (const data of result.items) {
        const tx = this.toTransaction(data);
        const isDeployTx = this.isDeployTransaction(data);

        if (isDeployTx) {
          deployTxFound = true;
        }

        timestamp = tx.timestamp;
        if (timestamp >= to || isDeployTx) {
          txs.push(tx);
        }
      }

      if (result.nextCursor) {
        apiUrl = this.getApiUrl(address, result.nextCursor);
        process = true;
      }
    }

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
    const apiUrl = this.getApiUrl(address);
    const result = await this.sendApiRequest<StarkScanTransactionsResponse>({
      apiUrl,
      responseStruct: StarkScanTransactionsResponseStruct,
      requestName: 'getTransactions',
    });

    for (const data of result.items) {
      if (this.isDeployTransaction(data)) {
        return this.toTransaction(data);
      }
    }

    return null;
  }

  protected isDeployTransaction(tx: StarkScanTransaction): boolean {
    return tx.txType === TransactionType.DEPLOY_ACCOUNT;
  }

  protected getContractAddress(tx: StarkScanTransaction): string {
    return tx.toAddress ?? tx.topTransferTokenAddress ?? '';
  }

  protected getSenderAddress(tx: StarkScanTransaction): string {
    if (this.isDeployTransaction(tx)) {
      return tx.toAddress ?? tx.fromAddress ?? '';
    }
    return tx.fromAddress ?? '';
  }

  protected toUnixTimestamp(timestampIso: string | null): number {
    if (!timestampIso) {
      return 0;
    }
    const ms = Date.parse(timestampIso);
    return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
  }

  protected toTransaction(tx: StarkScanTransaction): Transaction {
    const {
      txHash: txnHash,
      txType: txnType,
      timestampIso,
      finalityStatus,
      executionStatus,
      topTransferTokenAddress,
      topTransferAmount,
      counterparty,
      primaryMethod,
    } = tx;

    const { chainId } = this.network;
    const senderAddress = this.getSenderAddress(tx);
    const timestamp = this.toUnixTimestamp(timestampIso);
    const txnVersion = 3;

    let transaction: V2Transaction;

    if (this.isDeployTransaction(tx)) {
      transaction = newDeployTransaction({
        txnHash,
        senderAddress,
        chainId,
        txnVersion,
      });
    } else {
      const tokenAddress = topTransferTokenAddress ?? tx.toAddress ?? '';
      const calldata =
        counterparty && topTransferAmount
          ? [counterparty, topTransferAmount]
          : [];
      transaction = newInvokeTransaction({
        txnHash,
        senderAddress,
        chainId,
        maxFee: '0',
        calls: tokenAddress
          ? [
              {
                contractAddress: tokenAddress,
                entrypoint: primaryMethod ?? 'transfer',
                calldata,
              },
            ]
          : [],
        txnVersion,
      });
    }

    return {
      ...transaction,
      timestamp,
      finalityStatus: finalityStatus ?? transaction.finalityStatus,
      executionStatus: executionStatus ?? transaction.executionStatus,
      actualFee: null,
      maxFee: this.isDeployTransaction(tx) ? null : '0',
      contractAddress: this.getContractAddress(tx),
      failureReason: executionStatus === 'REVERTED' ? 'REVERTED' : '',
      txnType: (txnType as TransactionType) ?? transaction.txnType,
    };
  }
}
