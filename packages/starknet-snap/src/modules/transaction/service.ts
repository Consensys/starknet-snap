import { Transaction } from '../../types/snapState';
import { logger } from '../../utils/logger';
import { ITransactionMgr } from './types';

export class TransactionService {
  constructor(public txnMgr: ITransactionMgr) {}

  async list(address: string, chainId: string, tokenAddress?: string, minTimestamp?: number): Promise<Transaction[]> {
    try {
      return this.txnMgr.list(address, chainId, tokenAddress, minTimestamp);
    } catch (e) {
      logger.info(`[TransactionService.list] Error: ${e}`);
      throw new Error(e);
    }
  }
}
