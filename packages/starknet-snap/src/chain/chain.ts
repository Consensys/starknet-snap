import { TransactionType } from 'starknet';

import { ContractAddressFilter } from '../state/transaction-state-manager';
import type { Transaction } from '../types/snapState';
import type { IDataClient } from './data-client';

export class ChainService {
  protected dataClient: IDataClient;

  constructor(dataClient: IDataClient) {
    this.dataClient = dataClient;
  }

  async getTransactions(
    address: string,
    contractAddress: string,
    tillToInDay: number,
  ): Promise<Transaction[]> {
    const result = await this.dataClient.getTransactions(
      address,
      Date.now() - tillToInDay * 24 * 60 * 60 * 1000,
    );

    const contractAddressFilter = new ContractAddressFilter([contractAddress]);

    return result.filter((tx: Transaction) => {
      return (
        contractAddressFilter.apply(tx) ||
        tx.txnType === TransactionType.DEPLOY_ACCOUNT
      );
    });
  }
}
