import { Transaction } from '../../types/snapState';
import { ITransactionMgr } from './types';

export class TransactionService {
  constructor(public txnMgr: ITransactionMgr) {}

  async getTxns(
    address: string,
    chainId: string,
    tokenAddress?: string,
    minTimestamp?: number,
  ): Promise<Transaction[]> {
    return this.txnMgr.getTxns(address, chainId, tokenAddress, minTimestamp);
  }
}
