import { constants } from 'starknet';

import { AbstractDataClient } from './base';
import { DataClientError } from '../exceptions';
import { IReadDataClient } from '../types';
import { Transaction } from '../../../../types/snapState';
import { logger } from '../../../../utils/logger';

export type StarkScanClientOptions = {
  chainId: string;
  pageSize: number;
  timeLimit: number;
};

export type AccountCall = {
  block_hash: string;
  block_number: number;
  transaction_hash: string;
  caller_address: string;
  contract_address: string;
  calldata: string[];
  result: string[];
  timestamp: number;
  call_type: string;
  class_hash: string;
  selector: string;
  entry_point_type: string;
  selector_name: string;
};

export type StarkScanTxn = {
  transaction_hash: string;
  block_hash: string;
  block_number: number;
  transaction_index: number;
  transaction_status: string;
  transaction_finality_status: string;
  transaction_execution_status: string;
  transaction_type: string;
  version: number;
  signature: string[];
  max_fee: string | null;
  actual_fee: string;
  nonce: string;
  contract_address: string;
  entry_point_selector: string;
  entry_point_type: string;
  calldata?: string[];
  constructor_calldata?: string[];
  class_hash: string;
  sender_address: string;
  contract_address_salt: string;
  timestamp: number;
  entry_point_selector_name: string;
  number_of_events: number;
  revert_error: string;
  account_calls: AccountCall[];
};

export type GetStarkScanTxnsResponse = {
  data: StarkScanTxn[];
  next_url: string;
};

export enum EnumOrderBy {
  Asc = 'asc',
  Desc = 'desc',
}

export class StarkScanClient extends AbstractDataClient implements IReadDataClient {
  constructor(protected options: StarkScanClientOptions) {
    super();
  }

  get baseUrl() {
    try {
      switch (this.options.chainId) {
        case constants.StarknetChainId.SN_MAIN:
          return 'https://api.starkscan.co/api/v0';
        default:
          return 'https://api-sepolia.starkscan.co/api/v0';
      }
    } catch (e) {
      console.log('baseUrl error', e.message);
    }
  }

  get timeLimit() {
    return Date.now() - this.options.timeLimit;
  }

  protected getCredentialHeader(): Record<string, string> {
    return {
      'x-api-key': 'TaBXFzTRNg4iS6CfCHOBV26wIaGpI7Ai5SouisaV',
    };
  }

  async getRawTxns(
    address: string,
    pageSize: number,
    orderBy: EnumOrderBy = EnumOrderBy.Desc,
    nextUrl: string = null,
  ): Promise<GetStarkScanTxnsResponse> {
    try {
      logger.info(`[StarkScanClient.getRawTxns] start`);
      let url =
        nextUrl === null
          ? `${this.baseUrl}/transactions?contract_address=${address}&limit=${pageSize}&order_by=${orderBy}`
          : nextUrl;

      logger.info(`[StarkScanClient.getRawTxns] fetching url: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getCredentialHeader(),
      });
      logger.info(`[StarkScanClient.getRawTxns] response status: ${response.ok}`);
      return (await response.json()) as GetStarkScanTxnsResponse;
    } catch (e) {
      logger.info(`[StarkScanClient.getRawTxns] error: ${e.message}`);
      throw new DataClientError(e);
    }
  }

  async getTxns(address: string): Promise<Transaction[]> {
    try {
      logger.info(`[StarkScanClient.getTxns] start`);
      let txns: Transaction[] = [];
      let remainTxns: Transaction[] = [];
      let nextUrl = null;
      let process = true;
      while (process) {
        const { data, next_url } = await this.getRawTxns(address, this.options.pageSize, EnumOrderBy.Desc, nextUrl);
        nextUrl = next_url;
        process = nextUrl !== null;
        logger.info(`[StarkScanClient.getTxns] ${data.length} transactions fetched from data client`);
        for (const item of data) {
          if (!this.timeLimit || item.timestamp * 1000 >= this.timeLimit) {
            txns.push(this.format(item));
          } else {
            remainTxns.push(this.format(item));
            process = false;
          }
        }
      }
      this.lastScan = {
        lastPage: nextUrl,
        data: txns.concat(remainTxns),
      };
      return txns;
    } catch (e) {
      logger.info(`[StarkScanClient.getTxns] ${e.message}`);
      throw new DataClientError(e);
    }
  }

  protected async _getLastPageTxns(address: string): Promise<Transaction[]> {
    const { data } = await this.getRawTxns(address, 10, EnumOrderBy.Asc, null);
    return data.map((item) => this.format(item));
  }

  async getTxn(hash: string): Promise<Transaction> {
    return null;
  }

  protected format<T>(txn: T & StarkScanTxn): Transaction {
    return {
      txnHash: txn.transaction_hash,
      txnType: txn.transaction_type,
      chainId: this.options.chainId,
      senderAddress: txn.sender_address,
      contractAddress: this.extractContractAddress(txn),
      contractFuncName: this.extractContractFuncName(txn),
      contractCallData: this.extractContractCallData(txn),
      timestamp: txn.timestamp,
      finalityStatus: txn.transaction_finality_status,
      executionStatus: txn.transaction_execution_status,
      failureReason: txn.revert_error,
      eventIds: [],
    };
  }

  protected extractContractAddress(txn: StarkScanTxn): string {
    if (txn) {
      if (txn.account_calls && txn.account_calls.length > 0) {
        return txn.account_calls[0].contract_address;
      }

      if (txn.contract_address) {
        return txn.contract_address;
      }
    }

    return '';
  }

  protected extractContractFuncName(txn: StarkScanTxn): string {
    if (!txn || !txn.account_calls || txn.account_calls.length < 1) {
      return '';
    }
    return txn.account_calls[0].selector_name;
  }

  protected extractContractCallData(txn: StarkScanTxn): string[] {
    if (!txn || !txn.account_calls || txn.account_calls.length < 1) {
      return [];
    }
    return txn.account_calls[0].calldata;
  }
}
