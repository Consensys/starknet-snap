import { Transaction } from '../../../types/snapState';
import { ITransactionFilter } from '../../../utils/transaction/filter';

export class TransactionHelper {
  static Merge(txns1: Transaction[], txns2: Transaction[], deepMerge: boolean = false): [Transaction[], Transaction[]] {
    const seen = new Map<string, number>();
    const txns = [];
    const overlaps = [];
    txns1.forEach((txn) => {
      txns.push(txn);
      seen.set(txn.txnHash, txns.length - 1);
    });

    txns2.forEach((txn) => {
      if (!seen.has(txn.txnHash)) {
        txns.push(txn);
      } else {
        if (deepMerge) {
          const idx = seen.get(txn.txnHash);
          txns[idx] = {
            ...txns[idx],
            ...txn,
          };
        }
        overlaps.push(txn);
      }
    });

    return [txns, overlaps];
  }

  static FilterTransactions(txns: Transaction[], filters: ITransactionFilter[]): Transaction[] {
    return txns.filter((txn) => {
      return filters.every((filter) => filter.apply(txn));
    });
  }
}
