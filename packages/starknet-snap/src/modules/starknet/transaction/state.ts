import { TransactionType } from 'starknet';

import { SnapState, Transaction } from '../../../types/snapState';
import {
  ChainIdFilter,
  ContractAddressFilter,
  ITransactionFilter,
  SenderAddressFilter,
  TimestampFilter,
  TxnTypeFilter,
} from '../../../utils/transaction/filter';
import { SnapStateManager } from '../../snap';
import { TransactionHelper } from './helpers';
import { ITransactionStateMgr } from './types';
import { TransactionStateException } from './exceptions';

export class StarknetTransactionStateManager extends SnapStateManager<SnapState> implements ITransactionStateMgr {
  protected override async get(): Promise<SnapState> {
    return super.get().then((state) => {
      if (!state.transactionIndex) {
        state.transactionIndex = [];
      }

      if (!state.transactionDetails) {
        state.transactionDetails = {};
      }
      return state;
    });
  }

  protected getTransactionKey(txn: Transaction): string {
    return `${txn.txnHash.toLowerCase()}-${txn.chainId.toLowerCase()}`;
  }

  async getDeployAccountTxn(address: string, chainId: string): Promise<Transaction> {
    try {
      const state = await this.get();

      const result = TransactionHelper.FilterTransactions(
        state.transactionIndex.map((v) => state.transactionDetails[v]),
        [
          new ContractAddressFilter(address),
          new ChainIdFilter(chainId),
          new TxnTypeFilter(TransactionType.DEPLOY_ACCOUNT),
        ],
      );

      return result.length > 0 ? result[0] : null;
    } catch (e) {
      throw new TransactionStateException(e);
    }
  }

  async list(address?: string, chainId?: string, tokenAddress?: string, minTimestamp?: number): Promise<Transaction[]> {
    try {
      const state = await this.get();
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
        state.transactionIndex.map((v) => state.transactionDetails[v]),
        filters,
      );
    } catch (e) {
      throw new TransactionStateException(e);
    }
  }

  async remove(txns: Transaction[]): Promise<void> {
    try {
      return this.update(async (state: SnapState) => {
        const removeIds = new Set<string>();

        for (let i = 0; i < txns.length; i++) {
          const txn = txns[i];
          const key = this.getTransactionKey(txn);
          delete state.transactionDetails[key];
          removeIds.add(key);
        }
        state.transactionIndex = state.transactionIndex.filter((id) => !removeIds.has(id));
      });
    } catch (e) {
      throw new TransactionStateException(e);
    }
  }

  async save(txn: Transaction): Promise<void> {
    try {
      return this.update(async (state: SnapState) => {
        const key = this.getTransactionKey(txn);

        if (!state.transactionDetails.hasOwnProperty(key)) {
          state.transactionIndex.push(key);
        }

        state.transactionDetails[key] = txn;
      });
    } catch (e) {
      throw new TransactionStateException(e);
    }
  }

  async saveMany(txns: Transaction[]): Promise<void> {
    try {
      return this.update(async (state: SnapState) => {
        for (let i = 0; i < txns.length; i++) {
          const txn = txns[i];
          const key = this.getTransactionKey(txn);

          if (!state.transactionDetails.hasOwnProperty(key)) {
            state.transactionIndex.push(key);
          }

          state.transactionDetails[key] = txn;
        }
      });
    } catch (e) {
      throw new TransactionStateException(e);
    }
  }
}
