import { Transaction } from '../../types/snapState';

export interface ITransactionMgr {
  getTxns(address: string, chainId: string, tokenAddress?: string, minTimestamp?: number): Promise<Transaction[]>;
  getTxn(hash: string): Promise<Transaction>;
}
