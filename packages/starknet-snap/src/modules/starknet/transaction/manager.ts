import { TransactionStatus } from 'starknet';

import { Transaction } from '../../../types/snapState';
import { ChainIdFilter, ContractAddressFilter, StatusFilter, TimestampFilter } from '../../../utils/transaction/filter';
import { ITransactionMgr } from '../../transaction/types';
import { logger } from '../../../utils/logger';
import { AsyncHelper } from '../../async';
import { IReadDataClient } from '../data-client';
import { TransactionServiceException } from './exceptions';
import { TransactionHelper } from './helpers';
import { ITransactionStateMgr } from './types';
import { StarknetTransactionStateManager } from './state';

export class StarknetTransactionManager implements ITransactionMgr {
  private readonly txnStateMgr: ITransactionStateMgr;

  constructor(private readonly restfulDataClient: IReadDataClient, private readonly rpcDataClient: IReadDataClient) {
    this.txnStateMgr = new StarknetTransactionStateManager();
  }

  async getTxns(address: string, chainId: string, tokenAddress: string, minTimestamp?: number): Promise<Transaction[]> {
    try {
      logger.info(`[StarknetTransactionManager.getTxns] start`);

      let txns: Transaction[] = await this.txnStateMgr.list(address, chainId);

      let deployAccountTxn: Transaction;
      let fetchStatus = true;

      if (!txns || txns.length === 0) {
        logger.info(`[StarknetTransactionManager.getTxns] no txns found in local state, fetching from data client`);

        const dataClientResult = await this.getTxnsFromDataClient(address);

        txns = dataClientResult.txns;
        deployAccountTxn = dataClientResult.deployAccountTxn;

        await this.txnStateMgr.saveMany(txns.concat(deployAccountTxn));

        fetchStatus = false;
      } else {
        logger.info(`[StarknetTransactionManager.getTxns] ${txns.length} txns found in local state`);

        deployAccountTxn = await this.txnStateMgr.getDeployAccountTxn(address, chainId);
      }

      logger.info(
        `[StarknetTransactionManager.getTxns] filter txns on contractAddress = ${tokenAddress}, chainId = ${chainId}, timestamp >= ${minTimestamp}`,
      );

      const result = TransactionHelper.FilterTransactions(txns, [
        new ContractAddressFilter(tokenAddress),
        new ChainIdFilter(chainId),
        // not handle client local time issue
        new TimestampFilter(minTimestamp),
      ]);

      logger.info(`[StarknetTransactionManager.getTxns] filtered txns: ${result.length} found`);

      const mergedTxns = TransactionHelper.Merge(result, [deployAccountTxn])[0];

      logger.info(
        `[StarknetTransactionManager.getTxns] merge filtered txns with deploy txn: ${mergedTxns.length} found`,
      );

      if (fetchStatus) {
        await this.fetchStatus(mergedTxns);
      }

      return mergedTxns.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      logger.error(`[StarknetTransactionManager.getTxns] Error: ${e}`);
      return [];
    }
  }

  async getTxn(hash: string): Promise<Transaction> {
    logger.info(`[StarknetTransactionManager.getTxn] start`);
    try {
      return this.rpcDataClient.getTxn(hash);
    } catch (e) {
      logger.error(`[StarknetTransactionManager.getTxn] Error: ${e}`);
      throw e;
    }
  }

  protected async getTxnsFromDataClient(address: string): Promise<{
    txns: Transaction[];
    deployAccountTxn: Transaction;
  }> {
    logger.info(`[StarknetTransactionManager.getTxnsFromDataClient] start`);

    const txns = await this.restfulDataClient.getTxns(address);

    const deployAccountTxn = await this.restfulDataClient.getDeployAccountTxn(address);

    logger.info(
      `[StarknetTransactionManager.getTxnsFromDataClient] txns: ${txns.length} found,  deployTxn: ${
        deployAccountTxn ? 1 : 0
      } found`,
    );

    return {
      txns,
      deployAccountTxn,
    };
  }

  protected async fetchStatus(txns: Transaction[]): Promise<void> {
    logger.info(`[StarknetTransactionManager.fetchStatus] start`);

    const txnsNeededStatus = TransactionHelper.FilterTransactions(txns, [
      new StatusFilter(
        [TransactionStatus.RECEIVED, TransactionStatus.ACCEPTED_ON_L2, TransactionStatus.NOT_RECEIVED],
        [],
      ),
    ]);

    logger.info(`[StarknetTransactionManager.fetchStatus] ${txnsNeededStatus.length} transactions need status update`);

    await AsyncHelper.ProcessBatch<Transaction>(txnsNeededStatus, async (txn) => {
      await this.assignStatus(txn);
    });
  }

  protected async assignStatus(txn: Transaction): Promise<void> {
    logger.info(`[TransactionService.assignStatus] start`);
    try {
      const txnWithDetail = await this.getTxn(txn.txnHash);
      if (!txnWithDetail) {
        return;
      }
      txn.finalityStatus = txnWithDetail?.finalityStatus;
      txn.executionStatus = txnWithDetail?.executionStatus;
    } catch (e) {
      // not throw exception
      logger.error(`[TransactionService.assignStatus] Error: ${e}`);
    }
  }
}
