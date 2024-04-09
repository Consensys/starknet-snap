import { Transaction } from '../../types/snapState';
import { TransactionServiceException } from './exceptions';
import { ITransactionMgr } from './types';

export class TransactionService {
  constructor(protected txnMgr: ITransactionMgr) {}

  async getTxns(
    address: string,
    chainId: string,
    tokenAddress?: string,
    minTimestamp?: number,
  ): Promise<Transaction[]> {
    try {
      return this.txnMgr.getTxns(address, chainId, tokenAddress, minTimestamp);
    } catch (e) {
      throw new TransactionServiceException(e);
    }
  }
}
