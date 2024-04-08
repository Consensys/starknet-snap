import { Transaction } from '../../../../types/snapState';
import { TransactionType } from 'starknet';

export abstract class BaseRestfulDataClient {
  lastScan: {
    lastPage: string | number | null;
    data: Transaction[];
  };

  constructor() {
    this.lastScan = {
      lastPage: null,
      data: [],
    };
  }

  protected abstract _getLastPageTxns(address: string): Promise<Transaction[]>;

  async getDeployAccountTxn(address: string): Promise<Transaction> {
    const filter = new Set([TransactionType.DEPLOY_ACCOUNT.toLowerCase()]);
    let txns = this.lastScan.data;
    if (this.lastScan.lastPage) {
      txns = await this._getLastPageTxns(address);
    }

    // first deployed txn
    for (const txn of txns.sort((a, b) => a.timestamp - b.timestamp)) {
      if (filter.has(txn.txnType.toLowerCase())) {
        return txn;
      }
    }
    return null;
  }
}
