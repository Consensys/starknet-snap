import type { Transaction } from '../types/snapState';

export type IDataClient = {
  getTransactions: (address: string, tillTo: number) => Promise<Transaction[]>;
  getDeployTransaction: (address: string) => Promise<Transaction>;
};
