import { Transaction }  from '../../types/snapState'

export class TransactionHelper {
    static Merge(txns1: Transaction[], txns2: Transaction[]) {
        const seen = new Set<string>()
        const txns = []
        const overlaps = []
        txns1.forEach(txn => 
          {
            txns.push(txn)
            seen.add(txn.txnHash)
          }
        )
  
        txns2.forEach(txn => {
          if (!seen.has(txn.txnHash)) {
            txns.push(txn)
          } else {
            overlaps.push(txn)
          }
        })

        return [txns, overlaps]
    }
}