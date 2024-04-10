import { TransactionType } from 'starknet';

import { Transaction } from '../../../../types/snapState';
import { DataClientError } from '../exceptions';

export enum LastPageType {
  Empty = 'Empty',
}

export abstract class BaseRestfulDataClient {
  lastScan: {
    lastPage: string | LastPageType | number | null;
    data: Transaction[];
  };

  constructor() {
    this.lastScan = {
      lastPage: LastPageType.Empty,
      data: [],
    };
  }

  protected abstract _getLastPageTxns(address: string): Promise<Transaction[]>;

  async getDeployAccountTxn(address: string): Promise<Transaction> {
    try {
      const filter = new Set([TransactionType.DEPLOY_ACCOUNT.toLowerCase()]);
      let txns = this.lastScan.data;
      if (this.lastScan.lastPage || this.lastScan.lastPage === LastPageType.Empty) {
        txns = await this._getLastPageTxns(address);
      }

      // first deployed txn
      for (const txn of txns.sort((a, b) => a.timestamp - b.timestamp)) {
        if (filter.has(txn.txnType.toLowerCase())) {
          return txn;
        }
      }
      return null;
    } catch (e) {
      if (e instanceof DataClientError) {
        throw e;
      }
      throw new DataClientError(e);
    }
  }
}
