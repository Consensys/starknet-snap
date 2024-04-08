import { Transaction } from '../../../types/snapState';

export interface IReadDataClient {
  getTxns(address: string): Promise<Transaction[]>;
  getDeployAccountTxn(address: string): Promise<Transaction>;
  getTxn(hash: string): Promise<Transaction>;
}

export interface IWriteDataClient {}

export type IDataClient = IReadDataClient & IWriteDataClient;
