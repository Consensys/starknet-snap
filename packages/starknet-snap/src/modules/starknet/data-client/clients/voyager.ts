import { Transaction } from '../../../../types/snapState';
import { DataClientError } from '../exceptions';
import { IReadDataClient } from '../types';
import { constants } from 'starknet';
import { BaseRestfulDataClient } from './base';

export type VoyagerClientOptions = {
  chainId: string;
  apiKey: string;
  pageSize: number;
  timeLimit: number;
};

export type VoyagerTxn = {
  blockId: string;
  blockNumber: number;
  l1VerificationHash: string;
  hash: string;
  index: number;
  type: string;
  class_hash: string;
  calldata?: string[];
  sender_address: string;
  contract_address: string;
  timestamp: number;
  actual_fee: string;
  execution_status: string;
  revert_error: string;
  domain: string;
  status: string;
  finality_status: string;
  operations?: string;
  classAlias: string;
  contractAlias: string;
  senderAlias: string;
};

export type GetVoyagerTxnsResponse = {
  items: VoyagerTxn[];
  lastPage: number;
};

export class VoyagerClient extends BaseRestfulDataClient implements IReadDataClient {
  constructor(protected options: VoyagerClientOptions) {
    super();
  }

  get baseUrl() {
    switch (this.options.chainId) {
      case constants.StarknetChainId.SN_MAIN:
        return 'https://api.voyager.online/beta';
      default:
        return 'https://sepolia-api.voyager.online/beta';
    }
  }

  protected getCredentialHeader(): Record<string, string> {
    return {
      'X-API-Key': this.options.apiKey,
    };
  }

  get timeLimit() {
    return Date.now() - this.options.timeLimit;
  }

  protected async getRawTxns(address: string, pageSize: number, pageNum: number): Promise<GetVoyagerTxnsResponse> {
    try {
      // "ps" only effective on value: 10, 25, 50 as what's currently available in Voyager page
      const response = await fetch(`${this.baseUrl}/txns?to=${address}&ps=${pageSize}&p=${pageNum}`, {
        method: 'GET',
        headers: this.getCredentialHeader(),
      });

      if (!response.ok) {
        throw new DataClientError(`[VoyagerClient.getRawTxns] response status: ${response.status}`);
      }

      const result = await response.json();
      return result as GetVoyagerTxnsResponse;
    } catch (e) {
      throw new DataClientError(e);
    }
  }

  async getTxns(address: string): Promise<Transaction[]> {
    try {
      const txns: Transaction[] = [];
      const remainTxns: Transaction[] = [];

      let i = 1;
      let maxPage = i;
      let process = true;
      while (i <= maxPage && process) {
        const { items, lastPage } = await this.getRawTxns(address, this.options.pageSize, i);
        for (const item of items) {
          if (item.timestamp * 1000 >= this.timeLimit) {
            txns.push(this.format(item));
          } else {
            remainTxns.push(this.format(item));
            process = false;
          }
        }
        maxPage = lastPage;
        i += 1;
      }
      this.lastScan = {
        lastPage: i === maxPage ? null : maxPage,
        data: txns.concat(remainTxns),
      };

      return txns;
    } catch (e) {
      throw new DataClientError(e);
    }
  }

  protected async _getLastPageTxns(address: string): Promise<Transaction[]> {
    const { items } = await this.getRawTxns(address, 10, this.lastScan.lastPage as unknown as number);
    return items.map((item) => this.format(item));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTxn(hash: string): Promise<Transaction> {
    return null;
  }

  protected format<T>(txn: T & VoyagerTxn): Transaction {
    return {
      txnHash: txn.hash,
      txnType: txn.type,
      chainId: this.options.chainId,
      senderAddress: txn.sender_address,
      contractAddress: txn?.calldata[1] ?? txn.contract_address,
      contractFuncName: txn.operations || '',
      contractCallData: txn?.calldata ?? [],
      timestamp: txn.timestamp,
      finalityStatus: txn.finality_status,
      executionStatus: txn.execution_status,
      failureReason: txn.revert_error,
      eventIds: [],
    };
  }
}
