import { Transaction } from '../../types/snapState';
import { TransactionServiceError } from './exceptions';
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
      const result = await this.txnMgr.getTxns(address, chainId, tokenAddress, minTimestamp);
      return result;
    } catch (e) {
      throw new TransactionServiceError(e);
    }
  }
}
