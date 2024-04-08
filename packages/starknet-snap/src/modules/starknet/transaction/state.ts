import { SnapStateManager } from '../../snap/state';

import { ITransactionStateMgr } from './types';
import { SnapState, Transaction } from '../../../types/snapState';
import {
  ChainIdFilter,
  ContractAddressFilter,
  ITransactionFilter,
  SenderAddressFilter,
  TimestampFilter,
  TxnTypeFilter,
} from '../../../utils/transaction/filter';
import { TransactionHelper } from './helpers';
import { TransactionType } from 'starknet';
import { Lock } from '../../transaction';

export class StarknetTransactionStateManager extends SnapStateManager<SnapState> implements ITransactionStateMgr {
  constructor() {
    super(Lock.Acquire());
  }

  protected getTransactionKey(txn: Transaction): string {
    return `${txn.txnHash.toLowerCase()}-${txn.chainId.toLowerCase()}`;
  }

  async getDeployAccountTxn(address: string, chainId: string): Promise<Transaction> {
    const state = await this.get();

    const result = TransactionHelper.FilterTransactions(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(state.transactionDetails).map(([_, v]) => v),
      [
        new ContractAddressFilter(address),
        new ChainIdFilter(chainId),
        new TxnTypeFilter(TransactionType.DEPLOY_ACCOUNT),
      ],
    );

    return result.length > 0 ? result[0] : null;
  }

  async list(address?: string, chainId?: string, tokenAddress?: string, minTimestamp?: number): Promise<Transaction[]> {
    const state = await this.get();

    if (!state.transactionIndex || !state.transactionDetails) {
      return [];
    }

    const filters: ITransactionFilter[] = [];
    if (address) {
      filters.push(new SenderAddressFilter(address));
    }
    if (chainId) {
      filters.push(new ChainIdFilter(chainId));
    }
    if (tokenAddress) {
      filters.push(new ContractAddressFilter(tokenAddress));
    }
    if (minTimestamp) {
      filters.push(new TimestampFilter(minTimestamp));
    }

    return TransactionHelper.FilterTransactions(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(state.transactionDetails).map(([_, v]) => v),
      filters,
    );
  }

  async remove(txns: Transaction[]): Promise<void> {
    return this.update(async (state: SnapState) => {
      if (!state.transactionIndex) {
        state.transactionIndex = [];
      }

      if (!state.transactionDetails) {
        state.transactionDetails = {};
      }

      const removeIds = new Set<string>();

      for (let i = 0; i < txns.length; i++) {
        const txn = txns[i];
        const key = this.getTransactionKey(txn);
        delete state.transactionDetails[key];
        removeIds.add(txn.txnHash);
      }
      state.transactionIndex = state.transactionIndex.filter((txnHash) => !removeIds.has(txnHash));
    });
  }

  async save(txn: Transaction): Promise<void> {
    return this.update(async (state: SnapState) => {
      if (!state.transactionIndex) {
        state.transactionIndex = [];
      }

      if (!state.transactionDetails) {
        state.transactionDetails = {};
      }
      const key = this.getTransactionKey(txn);

      if (!state.transactionDetails.hasOwnProperty(key)) {
        state.transactionIndex.push(txn.txnHash);
      }

      state.transactionDetails[key] = txn;
    });
  }

  async saveMany(txns: Transaction[]): Promise<void> {
    return this.update(async (state: SnapState) => {
      if (!state.transactionIndex) {
        state.transactionIndex = [];
      }

      if (!state.transactionDetails) {
        state.transactionDetails = {};
      }

      for (let i = 0; i < txns.length; i++) {
        const txn = txns[i];
        const key = this.getTransactionKey(txn);

        if (!state.transactionDetails.hasOwnProperty(key)) {
          state.transactionIndex.push(txn.txnHash);
        }

        state.transactionDetails[key] = txn;
      }
    });
  }
}
