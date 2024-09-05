import type { constants, TransactionType } from 'starknet';
import {
  TransactionFinalityStatus,
  TransactionExecutionStatus,
} from 'starknet';
import { assert, enums, number, string } from 'superstruct';

import type { Transaction, SnapState, TranscationAccountCall } from '../types/snapState';
import { TransactionStatusType } from '../types/snapState';
import type { IFilter } from './filter';
import {
  BigIntFilter,
  ChainIdFilter as BaseChainIdFilter,
  StringFllter,
  Filter,
  MultiFilter,
} from './filter';
import { StateManager, StateManagerError } from './state-manager';

export type ITxFilter = IFilter<Transaction>;

export class ChainIdFilter
  extends BaseChainIdFilter<Transaction>
  implements ITxFilter {}

export class ContractAddressFilter
  extends MultiFilter<
  string,
  bigint,
  Transaction
> {
  protected _prepareSearch(search: string[]): void {
    this.search = new Set(search?.map((val) => BigInt(val)));
  }

  protected _apply(data: Transaction): boolean {
    if (!data.accountCalls) {
      return false;
    }
    return Object.keys(data.accountCalls).some( (contractAddress:string) => this.search.has(BigInt(contractAddress)));
  }
}

export class SenderAddressFilter
  extends BigIntFilter<Transaction>
  implements ITxFilter
{
  dataKey = 'senderAddress';
}

export class TxHashFilter
  extends BigIntFilter<Transaction>
  implements ITxFilter
{
  dataKey = 'txnHash';
}

export class TxTimestampFilter
  extends Filter<number, Transaction>
  implements ITxFilter
{
  _apply(data: Transaction): boolean {
    return this.search !== undefined && data.timestamp >= this.search;
  }
}

export class TxnTypeFilter
  extends StringFllter<Transaction>
  implements ITxFilter
{
  dataKey = 'txnType';
}

// Filter for transaction status
// Search for transactions based on the finality status and execution status
// It compare the finality status and execution status in OR condition, due to our use case is to find the transactions that fit to the given finality status or the given execution status
export class TxStatusFilter implements ITxFilter {
  finalityStatus: Set<string>;

  executionStatus: Set<string>;

  constructor(finalityStatus: string[], executionStatus: string[]) {
    this.finalityStatus = new Set(
      finalityStatus.map((val) => val.toLowerCase()),
    );
    this.executionStatus = new Set(
      executionStatus.map((val) => val.toLowerCase()),
    );
  }

  apply(txn: Transaction): boolean {
    let finalityStatusCond = false;
    let executionStatusCond = false;

    if (this.finalityStatus.size > 0) {
      finalityStatusCond =
        Object.prototype.hasOwnProperty.call(
          txn,
          TransactionStatusType.FINALITY,
        ) &&
        txn[TransactionStatusType.FINALITY] &&
        this.finalityStatus.has(
          txn[TransactionStatusType.FINALITY].toLowerCase(),
        );
    }

    if (this.executionStatus.size > 0) {
      executionStatusCond =
        Object.prototype.hasOwnProperty.call(
          txn,
          TransactionStatusType.EXECUTION,
        ) &&
        txn[TransactionStatusType.EXECUTION] &&
        this.executionStatus.has(
          txn[TransactionStatusType.EXECUTION].toLowerCase(),
        );
    }
    return finalityStatusCond || executionStatusCond;
  }
}

export type SearchFilter = {
  txnHash?: string[];
  txnType?: TransactionType[];
  chainId?: constants.StarknetChainId[];
  senderAddress?: string[];
  contractAddress?: string[];
  executionStatus?: TransactionExecutionStatus[];
  finalityStatus?: TransactionFinalityStatus[];
  timestamp?: number;
};

export class TransactionStateManager extends StateManager<Transaction> {
  protected getCollection(state: SnapState): Transaction[] {
    return state.transactions;
  }

  protected updateEntity(dataInState: Transaction, data: Transaction): void {
    assert(
      data.executionStatus,
      enums(Object.values(TransactionExecutionStatus)),
    );
    assert(
      data.finalityStatus,
      enums(Object.values(TransactionFinalityStatus)),
    );
    assert(data.timestamp, number());

    dataInState.executionStatus = data.executionStatus;
    dataInState.finalityStatus = data.finalityStatus;
    dataInState.timestamp = data.timestamp;
    dataInState.failureReason = data.failureReason;
  }

  #getCompositeKey(data: Transaction): string {
    const key1 = BigInt(data.chainId);
    const key2 = BigInt(data.txnHash);
    return `${key1}&${key2}`;
  }

  async findTransactions(
    {
      txnHash,
      txnType,
      chainId,
      senderAddress,
      contractAddress,
      executionStatus,
      finalityStatus,
      timestamp,
    }: SearchFilter,
    state?: SnapState,
  ): Promise<Transaction[]> {
    const filters: ITxFilter[] = [];
    if (txnHash !== undefined && txnHash.length > 0) {
      filters.push(new TxHashFilter(txnHash));
    }

    if (chainId !== undefined && chainId.length > 0) {
      filters.push(new ChainIdFilter(chainId));
    }

    if (timestamp !== undefined) {
      filters.push(new TxTimestampFilter(timestamp));
    }

    if (senderAddress !== undefined && senderAddress.length > 0) {
      filters.push(new SenderAddressFilter(senderAddress));
    }

    if (contractAddress !== undefined && contractAddress.length > 0) {
      filters.push(new ContractAddressFilter(contractAddress));
    }

    if (txnType !== undefined && txnType.length > 0) {
      filters.push(new TxnTypeFilter(txnType));
    }

    if (finalityStatus !== undefined || executionStatus !== undefined) {
      filters.push(
        new TxStatusFilter(finalityStatus ?? [], executionStatus ?? []),
      );
    }

    return this.list(
      filters,
      // sort by timestamp in descending order
      (entityA: Transaction, entityB: Transaction) =>
        entityB.timestamp - entityA.timestamp,
      state,
    );
  }

  /**
   * Finds a transaction object based on the given chain id and txn hash.
   *
   * @param param - The param object.
   * @param param.txnHash - The txn hash of the transaction object to search for.
   * @param [param.chainId] - The optional chain id of the transaction object to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the transaction object if found, or null if not found.
   */
  async getTransaction(
    {
      txnHash,
      chainId,
    }: {
      txnHash: string;
      chainId?: string;
    },
    state?: SnapState,
  ): Promise<Transaction | null> {
    const filters: ITxFilter[] = [new TxHashFilter([txnHash])];
    if (chainId !== undefined) {
      filters.push(new ChainIdFilter([chainId]));
    }
    return this.find(filters, state);
  }

  /**
   * Updates a transaction object in the state with the given data.
   *
   * @param data - The updated transaction object.
   * @returns A Promise that resolves when the update is complete.
   * @throws {StateManagerError} If there is an error updating the transaction object, such as:
   * If the transaction object to be updated does not exist in the state.
   */
  async updateTransaction(data: Transaction): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const dataInState = await this.getTransaction(
          {
            txnHash: data.txnHash,
            chainId: data.chainId,
          },
          state,
        );
        if (!dataInState) {
          throw new Error(`Transaction does not exist`);
        }
        this.updateEntity(dataInState, data);
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Adds a new transaction object to the state with the given data.
   *
   * @param data - The transaction object to add.
   * @returns A Promise that resolves when the add is complete.
   * @throws {StateManagerError} If there is an error adding the transaction object, such as:
   * If the transaction object to be added already exists in the state.
   */
  async addTransaction(data: Transaction): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const dataInState = await this.getTransaction(
          {
            txnHash: data.txnHash,
            chainId: data.chainId,
          },
          state,
        );

        if (dataInState) {
          throw new Error(`Transaction already exist`);
        }
        state.transactions.push(data);
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Removes the transaction objects in the state with the given search conditions.
   *
   * @param searchFilter - The searchFilter object.
   * @returns A Promise that resolves when the remove is complete.
   */
  async removeTransactions(searchFilter: SearchFilter): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const dataInState = await this.findTransactions(searchFilter, state);

        const dataSet = new Set<string>(
          dataInState.map((txn) => this.#getCompositeKey(txn)),
        );

        state.transactions = state.transactions.filter((txn) => {
          return !dataSet.has(this.#getCompositeKey(txn));
        });
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }
}
