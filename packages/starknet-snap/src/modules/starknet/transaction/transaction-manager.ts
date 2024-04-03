import { constants, TransactionType } from "starknet";

import { IReadDataClient } from "../data-client";
import { TransactionServiceException } from "./exceptions";
import { Transaction, } from '../../../types/snapState';
import { AsyncHelper } from '../../async'
import { ContractAddressFilter, TimestampFilter, filterTransactions } from "../../../utils/transaction/filter";
import { ITransactionMgr } from "../../transaction/types";
import { TransactionHelper } from "../../transaction/helpers";
import { logger } from "../../../utils/logger";

export class StarknetTransactionManager implements ITransactionMgr {
    constructor(
      private readonly restfulDataClient: IReadDataClient
    ) {}

    protected async mergeTxnsWithDetail(txns:Transaction[]): Promise<Transaction[]> {
        try {
            let txnsWithDetail = [];
            await AsyncHelper.ProcessBatch<Transaction>(txns, async(txn:Transaction) => {
              const txnWithDetail = await this.restfulDataClient.getTxn(txn.txnHash);
              txnsWithDetail.push(txnWithDetail);
            })
            return txnsWithDetail;
        } catch (e) {
          throw new TransactionServiceException(e);
        }
    }

    async list(
        address: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        chainId: string,
        tokenAddress: string,
        minTimestamp: number,
      ): Promise<Transaction[]> {
      logger.info(`[StarknetTransactionManager] list start`)
      const txns = await this.restfulDataClient.getTxns(address, minTimestamp);
      
      const deployTxns = await this.restfulDataClient.getDeployTxns(address);
      
      logger.info(`[StarknetTransactionManager] Total Transactions: ${txns.length}, Deployment Transactions: ${deployTxns.length}`)

      const result = TransactionHelper.Merge(
        filterTransactions(txns, [new TimestampFilter(minTimestamp), new ContractAddressFilter(tokenAddress)]), 
        deployTxns
      );

      logger.info(`[StarknetTransactionManager] Merged Transactions: ${result[0].length}`)

      return result[0]
    }
}