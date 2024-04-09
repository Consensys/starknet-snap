import { Transaction } from '../../../types/snapState';
import { ITransactionFilter } from '../../../utils/transaction/filter';

export class TransactionHelper {
  static Merge(txns1: Transaction[], txns2: Transaction[], deepMerge = false): [Transaction[], Transaction[]] {
    const seen = new Map<string, number>();
    const overlaps = [];
    txns1.forEach((txn, i) => {
      seen.set(txn.txnHash, i);
    });

    txns2.forEach((txn) => {
      if (!seen.has(txn.txnHash)) {
        txns1.push(txn);
      } else {
        if (deepMerge) {
          const idx = seen.get(txn.txnHash);
          txns1[idx] = {
            ...txns1[idx],
            ...txn,
          };
        }
        overlaps.push(txn);
      }
    });

    return [txns1, overlaps];
  }

  static FilterTransactions(txns: Transaction[], filters: ITransactionFilter[]): Transaction[] {
    return txns.filter((txn) => {
      return filters.every((filter) => filter.apply(txn));
    });
  }
}
