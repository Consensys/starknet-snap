import { Transaction } from '../../../types/snapState';

export interface IReadDataClient {
  getTxns(address: string): Promise<Transaction[]>;
  getDeployAccountTxn(address: string): Promise<Transaction>;
  getTxn(hash: string): Promise<Transaction>;
  //getBalance(address: string): Promise<string>;
}

export interface IWriteDataClient {
  executeTxn(txn: Transaction): Promise<void>;
  estimateFee(txn: Transaction): Promise<string>;
  estimateFees(txn: Transaction): Promise<string>;
}

export type IDataClient = IReadDataClient & IWriteDataClient;
