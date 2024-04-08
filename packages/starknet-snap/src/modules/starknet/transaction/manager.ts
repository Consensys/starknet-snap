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
  private readonly stateMgr: ITransactionStateMgr

  constructor(
    private readonly restfulDataClient: IReadDataClient,
  )
  {
    this.stateMgr = new StarknetTransactionStateManager();
  }

  async list(
    address: string,
    chainId: string,
    tokenAddress: string,
    minTimestamp?: number
  ): Promise<Transaction[]> {
    try {
      logger.info(`[StarknetTransactionManager.list] start`);

      let txns: Transaction[] = await this.stateMgr.list(address, chainId);
      
      let deployAccountTxn: Transaction;
      let fetchStatus = true;

      if(!txns || txns.length === 0) {
        logger.info(`[StarknetTransactionManager.list] no txns found in local state, fetching from data client`);

        const dataClientResult = await this.getTxnsFromDataClient(address);

        txns = dataClientResult.txns;
        deployAccountTxn = dataClientResult.deployAccountTxn;

        fetchStatus = false;
      } else {
        logger.info(`[StarknetTransactionManager.list] ${txns.length} txns found in local state`);

        deployAccountTxn = await this.stateMgr.getDeployAccountTxn(address, chainId)
      }

      logger.info(`[StarknetTransactionManager.list] txns: ${txns.length} found,  deployTxn: ${deployAccountTxn ? 1: 0} found`);

      logger.info(`[StarknetTransactionManager.list] filter txns on contractAddress = ${tokenAddress}, chainId = ${chainId}, timestamp >= ${minTimestamp}`);

      const result = TransactionHelper.FilterTransactions(txns, [
        new ContractAddressFilter(tokenAddress), 
        new ChainIdFilter(chainId),
        // not handle client local time issue
        new TimestampFilter(minTimestamp)
      ])

      logger.info(`[StarknetTransactionManager.list] filtered txns: ${result.length} found`);
      
      const mergedTxns = TransactionHelper.Merge(result, [deployAccountTxn])[0];

      logger.info(`[StarknetTransactionManager.list] merge filtered txns with deploy txn: ${mergedTxns.length} found`);

      if (fetchStatus) {
        await this.fetchStatus(mergedTxns);
      }

      return mergedTxns.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      logger.info(`[StarknetTransactionManager.list] Error: ${e}`);
      throw new TransactionServiceException(e);
    }
  }

  async get(hash: string): Promise<Transaction> {
    return null;
  }

  async bulkGetDetails(hash: string): Promise<Transaction> {
    return null;
  }

  protected async getTxnsFromDataClient(address: string): Promise<{
    txns: Transaction[],
    deployAccountTxn: Transaction
  }> {
    const txns = await this.restfulDataClient.getTxns(address);

    const deployAccountTxn = await this.restfulDataClient.getDeployAccountTxn(address);

    await this.stateMgr.saveMany(txns.concat(deployAccountTxn));

    return {
      txns,
      deployAccountTxn
    }
  }

  protected async fetchStatus(txns: Transaction[]): Promise<void> {
    try {
      logger.info(`[StarknetTransactionManager.fetchStatus] start`);

      const txnsNeededStatus = TransactionHelper.FilterTransactions(
        txns,
        [
          new StatusFilter([
            TransactionStatus.RECEIVED,
            TransactionStatus.ACCEPTED_ON_L2,
            TransactionStatus.NOT_RECEIVED
          ], [])
        ]
      );

      logger.info(`[StarknetTransactionManager.fetchStatus] ${txnsNeededStatus.length} transactions need status update`);

      await AsyncHelper.ProcessBatch<Transaction>(txnsNeededStatus, this.assignStatus);
    } catch (e) {
      logger.info(`[TransactionService.fetchStatus] Error: ${e}`);
      throw new Error(e);
    }
  }

  protected async assignStatus(txn: Transaction): Promise<void> {
    const txnWithDetail = await this.get(txn.txnHash);
    if (!txnWithDetail) {
      return;
    }
    txn.finalityStatus = txnWithDetail?.finalityStatus;
    txn.executionStatus = txnWithDetail?.executionStatus;
  }
}
