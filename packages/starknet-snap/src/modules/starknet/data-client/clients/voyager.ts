import { Transaction, } from '../../../../types/snapState';
import { DataClientError } from '../exceptions';
import { IReadDataClient } from '../types';
import {  constants } from 'starknet';
import { AbstractDataClient } from './base';
import { logger } from '../../../../utils/logger';

export type VoyagerClientOptions = {
    chainId: string;
    pageSize: number; 
}

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
}

export type GetVoyagerTxnsResponse = {
    items: VoyagerTxn[];
    lastPage: number;
}

export type GetVoyagerTxnResponse = {
  header: {
    blockId: string;
    blockNumber: number;
    hash: string;
    index: number;
    l1VerificationHash: string | null;
    type: string;
    contract_address: string;
    sender_address: string;
    timestamp: number;
    signature: string[];
    class_hash: string | null;
    execution_status: string;
    status: string;
    finality_status: string;
    classAlias: string | null;
    senderAlias: string | null;
    contractAlias: string | null;
  };
  contractAddressSalt: string | null;
  maxFee: string;
  actualFee: string;
  gasConsumed: string;
  nonce: string;
  version: string;
  receipt: {
    events: {
      blockNumber: number;
      fromAddress: string;
      blockHash: string;
      timestamp: number;
      selector: string;
      name: string;
      nestedName: string;
      nestedEventNames: string[];
      id: string;
      contractAlias: string | null;
    }[];
    messages: number;
    tokensTransferred: {
      from: string;
      to: string;
      amount: string;
      function: string;
      tokenId: string;
      tokenAddress: string;
      symbol: string;
      decimals: number;
      usd: string;
      fromAlias: string | null;
      toAlias: string | null;
      index: string;
      tokenName: string;
    }[];
    feeTransferred: {
      from: string;
      to: string;
      amount: string;
      function: string;
      tokenId: string;
      tokenAddress: string;
      symbol: string;
      decimals: number;
      usd: string;
      fromAlias: string | null;
      toAlias: string | null;
      index: string;
      tokenName: string;
    }[];
  };
  executionResources: {
    steps: number;
    data_availability: {
      l1_gas: number;
      l1_data_gas: number;
    };
    ecdsa_builtin_applications: number;
    pedersen_builtin_applications: number;
    range_check_builtin_applications: number;
  };
  statusTimeRemaining: number | null;
  revert_error: string | null;
}

export class VoyagerClient extends AbstractDataClient implements IReadDataClient  {

  get baseUrl() {
    try {
      switch (this.options.chainId) {
        case constants.StarknetChainId.SN_MAIN:
          return 'https://voyager.online/api';
        default:
          return 'https://eer9th3mo4.execute-api.eu-central-1.amazonaws.com/api';
      }
    } catch (e) {
      console.log("baseUrl error", e.message) 
    }
  }

  constructor(protected options: VoyagerClientOptions) {
    super();
  }

  protected async getRawTxns(address: string,
    pageSize: number,
    pageNum: number
    ): Promise<GetVoyagerTxnsResponse> {
    try {
        logger.info(`[VoyagerClient] getRawTxns start`)
        // "ps" only effective on value: 10, 25, 50 as what's currently available in Voyager page
        const response = await fetch(`${this.baseUrl}/txns?to=${address}&ps=${pageSize}&p=${pageNum}`, {
            method: "GET",
            mode: "cors",
        });
        logger.info(`[VoyagerClient] getRawTxns status ${response.ok}`)
        const result = await response.json()
        return result as GetVoyagerTxnsResponse;
    } catch (e) {
      logger.info(`[VoyagerClient] getRawTxns error ${e.message}`)
      throw new DataClientError(e);
    }
  }

  protected async getRawTxn(txnHash:string
    ): Promise<GetVoyagerTxnResponse> {
    try {
        const response = await fetch(`${this.baseUrl}/txn/${txnHash}`, {
            method: "GET",
            mode: "cors",
        });
        return await response.json() as GetVoyagerTxnResponse;
    } catch (e) {
      throw new DataClientError(e);
    }
  }

  async getTxns(address: string,
    startFrom: number
    ): Promise<Transaction[]> {
    try {
        logger.info(`[VoyagerClient] getTxns start`)
        let txns:Transaction[] = [];
        let remainTxns:Transaction[] = [];

        let i = 1;
        let maxPage = i;
        let process = true
        while (i <= maxPage && process)
        {
          const { items, lastPage } = await this.getRawTxns(address, this.options.pageSize, i);
          for (const item of items) {
              if (item.timestamp * 1000 >= startFrom) {
                  txns.push(this.format(item));
              } else {
                  remainTxns.push(this.format(item));
                  process = false
              }
          }
          maxPage = lastPage;
          i += 1
        }
        this.lastScan = {
            lastPage:  i === maxPage ? null : maxPage,
            data: txns.concat(remainTxns)
        }
        
        return txns;
    } catch (e) {
      logger.info(`[VoyagerClient] getTxns error: ${e.message}`);
      throw new DataClientError(e);
    }
  }
  
  protected async _getDeployTxns<T>(
    address: string,
    ): Promise<T[]> {
    const { items } = await this.getRawTxns(address, 10, this.lastScan.lastPage as unknown as number);
    return items as T[] ;
  }
  
  async getTxn(hash: string): Promise<Transaction> {
    return null
  }

  protected format<T>(txn: T & VoyagerTxn) : Transaction {
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
      eventIds: []
    }
  } 

}
