import { TransactionFinalityStatus, TransactionType } from 'starknet';

import { TransactionStateManager } from '../state/transaction-state-manager';
import type {
  Network,
  Transaction,
  TransactionsCursor,
  V2Transaction,
} from '../types/snapState';
import { TransactionDataVersion } from '../types/snapState';
import type { IDataClient } from './data-client';

export class TransactionService {
  protected dataClient: IDataClient;

  protected txnStateMgr: TransactionStateManager;

  protected network: Network;

  constructor({
    dataClient,
    txnStateMgr = new TransactionStateManager(),
    network,
  }: {
    dataClient: IDataClient;
    txnStateMgr?: TransactionStateManager;
    network: Network;
  }) {
    this.dataClient = dataClient;
    this.network = network;
    this.txnStateMgr = txnStateMgr;
  }

  /**
   *
   * Get the transactions by the given address and contract address.
   * The transactions will be filtered by the contract address.
   * Cursor is used to paginate the transactions.
   *
   * @param address
   * @param contractAddress
   * @param cursor
   * @param cursor.blockNumber
   * @param cursor.txnHash
   * @yields getTransactionsOnChain: Yields transactions filtered by contract address and a cursor for pagination.
   */
  protected async *getTransactionsOnChain(
    address: string,
    contractAddress: string,
    cursor?: { blockNumber: number; txnHash: string },
  ): AsyncGenerator<Transaction | { cursor: TransactionsCursor }> {
    const { transactions, cursor: newCursor } =
      await this.dataClient.getTransactions(address, cursor);

    // Yield the cursor for the next page of transactions.
    yield { cursor: newCursor };

    yield* this.filterTransactionsByContractAddress(
      transactions,
      contractAddress,
    );
  }

  protected async *getTransactionsOnState(
    address: string,
    contractAddress: string,
  ): AsyncGenerator<Transaction> {
    const transactions = await this.txnStateMgr.findTransactions({
      senderAddress: [address],
      chainId: [this.network.chainId],
      finalityStatus: [TransactionFinalityStatus.RECEIVED],
      // Exculde the transaction data that are not in the latest version,
      // hence we dont have to migrate the data, as it can be retrieved from the chain eventually.
      dataVersion: [TransactionDataVersion.V2],
    });
    // FIXME:
    // filter from state manager doesnt support OR condition (contractAddress match or it is a account deploy transaction),
    // hence we have to filter it manually.
    yield* this.filterTransactionsByContractAddress(
      transactions,
      contractAddress,
    );
  }

  protected async *filterTransactionsByContractAddress(
    transactions: Transaction[],
    contractAddress: string,
  ): AsyncGenerator<Transaction> {
    for (const tx of transactions) {
      // Only return transaction that are related to the contract address / deployed transactions or failed.
      if (
        this.hasMatchingContractOrIsDeploy(tx, contractAddress) ||
        tx.failureReason
      ) {
        yield tx;
      }
    }
  }

  protected hasMatchingContractOrIsDeploy(
    tx: Transaction,
    contractAddress: string,
  ) {
    const isDeployTx = tx.txnType === TransactionType.DEPLOY_ACCOUNT;
    const { accountCalls } = tx as V2Transaction;
    const isSameContract =
      accountCalls &&
      Object.prototype.hasOwnProperty.call(accountCalls, contractAddress);
    return isDeployTx || isSameContract;
  }

  /**
   * Get the transactions by the given address and contract address.
   * The transactions will also include the account deploy transaction.
   *
   * @param address - The account address.
   * @param contractAddress - The contract address.
   * @param cursor
   * @param cursor.blockNumber
   * @param cursor.txnHash
   * @returns A promise that resolves to an array of transactions of the given address.
   */
  public async getTransactions(
    address: string,
    contractAddress: string,
    cursor?: { blockNumber: number; txnHash: string },
  ): Promise<{ transactions: Transaction[]; cursor: TransactionsCursor }> {
    const transactionsOnChain: Transaction[] = [];
    const transactionsOnState: Transaction[] = [];
    const transactionsToRemove: string[] = [];
    const transactionsOnChainSet = new Set<string>();

    let nextCursor: TransactionsCursor = {
      blockNumber: -1,
      txnHash: '',
    };

    for await (const result of this.getTransactionsOnChain(
      address,
      contractAddress,
      cursor,
    )) {
      if ('cursor' in result) {
        nextCursor = result.cursor;
      } else {
        transactionsOnChain.push(result);
        transactionsOnChainSet.add(result.txnHash);
      }
    }

    for await (const tx of this.getTransactionsOnState(
      address,
      contractAddress,
    )) {
      // eslint-disable-next-line no-negated-condition
      if (!transactionsOnChainSet.has(tx.txnHash)) {
        transactionsOnState.push(tx);
      } else {
        transactionsToRemove.push(tx.txnHash);
      }
    }

    if (transactionsToRemove.length > 0) {
      await this.txnStateMgr.removeTransactions({
        txnHash: transactionsToRemove,
      });
    }
    // Merge the transactions from state and chain.
    // The transactions from state will be added first, then the transactions from chain.
    return {
      transactions: transactionsOnState.concat(transactionsOnChain),
      cursor: nextCursor,
    };
  }
}
