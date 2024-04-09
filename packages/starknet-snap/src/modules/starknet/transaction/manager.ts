import { TransactionStatus } from 'starknet';

import { Transaction } from '../../../types/snapState';
import { ContractAddressFilter, StatusFilter, TimestampFilter } from '../../../utils/transaction/filter';
import { ITransactionMgr } from '../../transaction/types';
import { logger } from '../../../utils/logger';
import { AsyncHelper } from '../../async';
import { IReadDataClient } from '../data-client';
import { TransactionHelper } from './helpers';
import { ITransactionStateMgr } from './types';
import { StarknetTransactionStateManager } from './state';

export class StarknetTransactionManager implements ITransactionMgr {
  private readonly txnStateMgr: ITransactionStateMgr;

  constructor(private readonly restfulDataClient: IReadDataClient, private readonly rpcDataClient: IReadDataClient) {
    this.txnStateMgr = new StarknetTransactionStateManager();
  }

  async getTxn(hash: string): Promise<Transaction> {
    try {
      return this.rpcDataClient.getTxn(hash);
    } catch (e) {
      logger.error(`[StarknetTransactionManager.getTxn] Error: ${e}`);
      throw e;
    }
  }

  async getTxns(address: string, chainId: string, tokenAddress: string, minTimestamp?: number): Promise<Transaction[]> {
    try {
      let txns = await this.txnStateMgr.list(address, chainId);
      let deployAccountTxn = await this.txnStateMgr.getDeployAccountTxn(address, chainId);
      logger.info(`[StarknetTransactionManager.getTxns] ${txns.length} transactions found from state`);

      const hasTxnsFromState = deployAccountTxn || (txns && txns.length > 0);

      if (!hasTxnsFromState) {
        txns = await this.restfulDataClient.getTxns(address);
        deployAccountTxn = await this.restfulDataClient.getDeployAccountTxn(address);
        logger.info(`[StarknetTransactionManager.getTxns] ${txns.length} transactions found from chain`);

        await this.txnStateMgr.saveMany(txns);
      }

      txns = this.filterAndMergeTxns(txns, deployAccountTxn, tokenAddress, minTimestamp);
      logger.info(`[StarknetTransactionManager.getTxns] ${txns.length} transactions found after filtered and merged`);

      if (hasTxnsFromState) {
        const txnsNeededStatus = this.filterTxnsNeedUpdate(txns);
        logger.info(`[StarknetTransactionManager.getTxns] ${txnsNeededStatus.length} transactions need status update`);

        await this.fetchStatus(txnsNeededStatus);
        await this.txnStateMgr.saveMany(txnsNeededStatus);
      }

      return txns.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      logger.error(`[StarknetTransactionManager.getTxns] Error: ${e}`);
      return [];
    }
  }

  protected filterAndMergeTxns(
    txns: Transaction[],
    deployAccountTxn: Transaction,
    tokenAddress: string,
    minTimestamp: number,
  ): Transaction[] {
    const result = TransactionHelper.FilterTransactions(txns, [
      new ContractAddressFilter(tokenAddress),
      // timestamp filter may not accuary if client clock is not sync
      new TimestampFilter(minTimestamp),
    ]);

    return TransactionHelper.Merge(result, [deployAccountTxn])[0];
  }

  protected filterTxnsNeedUpdate(txns: Transaction[]): Transaction[] {
    return TransactionHelper.FilterTransactions(txns, [
      new StatusFilter(
        [TransactionStatus.RECEIVED, TransactionStatus.ACCEPTED_ON_L2, TransactionStatus.NOT_RECEIVED],
        [],
      ),
    ]);
  }

  protected async fetchStatus(txns: Transaction[]): Promise<void> {
    await AsyncHelper.ProcessBatch<Transaction>(txns, async (txn) => {
      await this.assignStatus(txn);
    });
  }

  protected async assignStatus(txn: Transaction): Promise<void> {
    try {
      const txnWithDetail = await this.getTxn(txn.txnHash);
      if (txnWithDetail) {
        txn.finalityStatus = txnWithDetail?.finalityStatus;
        txn.executionStatus = txnWithDetail?.executionStatus;
      }
    } catch (e) {
      // not throw exception
      logger.error(`[StarknetTransactionManager.assignStatus] Error: ${e}`);
    }
  }
}
