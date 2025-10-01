import type { Transaction, TransactionsCursor } from '../types/snapState';

export type IDataClient = {
  getTransactions: (
    address: string,
    cursor?: TransactionsCursor,
  ) => Promise<{ transactions: Transaction[]; cursor: TransactionsCursor }>;
  getDeployTransaction: (address: string) => Promise<Transaction | null>;
};
