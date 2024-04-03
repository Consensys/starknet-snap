import { ITransactionRepo } from "./types";
import { SnapState, Transaction } from '../../types/snapState';
import { Mutex } from "async-mutex";
import { SnapHelper } from "../snap";
import { ChainIdFilter, ContractAddressFilter, ITransactionFilter, SenderAddressFilter, TimestampFilter, filterTransactions } from "../../utils/transaction/filter";

export class TransactionRepository implements ITransactionRepo {
 
  constructor(protected lock?: Mutex) {
    if (!this.lock) {
      this.lock = new Mutex()
    }
  }

  protected getTransactionKey(txn: Transaction): string {
    return `${txn.txnHash.toLowerCase()}-${txn.chainId.toLowerCase()}`;
  }

  async list(
    address: string,
    chainId: string,
    tokenAddress?: string,
    minTimestamp?: number,
  ): Promise<Transaction[]> {
    const state = await SnapHelper.getStateData<SnapState>()
    if (!state.transactionIndex || !state.transactionDetails) {
      return []
    }
    const filters:ITransactionFilter[] = [new SenderAddressFilter(address), new ChainIdFilter(chainId)];

    if (tokenAddress) {
      filters.push(new ContractAddressFilter(tokenAddress));
    }
    if (minTimestamp) {
      filters.push(new TimestampFilter(minTimestamp));
    }
    return filterTransactions(Object.entries(state.transactionDetails).map(([_,v]) => v), filters)
  }

  async remove(
    txns: Transaction[]
  ): Promise<void> {
    return this.lock.runExclusive(async () => {
      const state = await SnapHelper.getStateData<SnapState>()
      if (!state.transactionIndex) {
        state.transactionIndex = []
      }

      if (!state.transactionDetails) {
        state.transactionDetails = {}
      }

      const removeIds = new Set<string>()
      for (let i = 0 ; i < txns.length; i++) {
        const txn = txns[i]
        const key = this.getTransactionKey(txn);
        delete state.transactionDetails[key]
        removeIds.add(txn.txnHash)
      }
      state.transactionIndex = state.transactionIndex.filter((txnHash) => !removeIds.has(txnHash))

      await SnapHelper.setStateData<SnapState>(state)
    })
  }

  async save(txn: Transaction): Promise<void> {
    return this.lock.runExclusive(async () => {
      const state = await SnapHelper.getStateData<SnapState>()

      if (!state.transactionIndex) {
        state.transactionIndex = []
      }

      if (!state.transactionDetails) {
        state.transactionDetails = {}
      }

      const key = this.getTransactionKey(txn);

      if (!state.transactionDetails.hasOwnProperty(key)) {
        state.transactionIndex.push(txn.txnHash)
      }

      state.transactionDetails[key] = txn
      await SnapHelper.setStateData<SnapState>(state)
    })
  }

  async saveMany(txns: Transaction[]): Promise<void> {
    return this.lock.runExclusive(async () => {
      const state = await SnapHelper.getStateData<SnapState>()
      
      if (!state.transactionIndex) {
        state.transactionIndex = []
      }

      if (!state.transactionDetails) {
        state.transactionDetails = {}
      }

      for (let i = 0 ; i < txns.length; i++) {
        const txn = txns[i]
        const key = this.getTransactionKey(txn);

        if (!state.transactionDetails.hasOwnProperty(key)) {
          state.transactionIndex.push(txn.txnHash)
        }

        state.transactionDetails[key] = txn
      }
      
      await SnapHelper.setStateData<SnapState>(state)
    })
  }
}