import { Transaction } from '../../types/snapState';


export interface ITransactionRepo {
  list(address?: string, chainId?: string, tokenAddress?: string, minTimestamp?: number): Promise<Transaction[]>;
  findAccountDeployTransaction(chainId: string): Promise<Transaction>;
  save(txn: Transaction): Promise<void>;
  saveMany(txn: Transaction[]): Promise<void>;
  remove(txns: Transaction[]): Promise<void>;
}

export interface ITransactionMgr {
  list(address: string, chainId: string, tokenAddress?: string, minTimestamp?: number): Promise<Transaction[]>;
  get(hash: string): Promise<Transaction>;
}
