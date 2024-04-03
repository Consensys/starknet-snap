import { Transaction, } from '../../../../types/snapState';
import { TransactionType } from 'starknet';

export abstract class AbstractDataClient {
  
  lastScan: {
    lastPage: string | number | null;
    data: Transaction[];
  }

  constructor() {
    this.lastScan = {
        lastPage: null,
        data: []
    }
  }

  protected abstract _getDeployTxns<T>(address: string): Promise<T[]>;
  protected abstract format<T>(txn: T): Transaction;

  async getDeployTxns(
    address: string,
    ): Promise<Transaction[]> {
        const filter = new Set([TransactionType.DEPLOY.toLowerCase(), TransactionType.DEPLOY_ACCOUNT.toLowerCase()]);

        if (!this.lastScan.lastPage) {
            return this.lastScan.data.filter(txn => filter.has(txn.txnType.toLowerCase()));
        }

        let txns: Transaction[] = [];
        const items = await this._getDeployTxns(address);
        for (const item of items) {
            const txn = this.format(item)
            if (filter.has(txn.txnType.toLowerCase())) {
                txns.push(txn);
            }
        }
        return txns
  }
}
