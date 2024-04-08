import { Transaction } from '../../../types/snapState';

export interface ITransactionStateMgr {
  list(address?: string, chainId?: string, tokenAddress?: string, minTimestamp?: number): Promise<Transaction[]>;
  save(txn: Transaction): Promise<void>;
  saveMany(txn: Transaction[]): Promise<void>;
  remove(txns: Transaction[]): Promise<void>;
  getDeployAccountTxn(address: string, chainId: string): Promise<Transaction>;
}
