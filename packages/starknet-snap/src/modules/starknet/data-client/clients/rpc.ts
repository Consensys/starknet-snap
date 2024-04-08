import { Provider, constants } from 'starknet';

import { IReadDataClient } from '../types';
import { Transaction } from '../../../../types/snapState';
import { DataClientError } from '../exceptions';

export type RpcClientOptions = {
  chainId: string;
  apiKey: string;
};

export class RpcDataClient implements IReadDataClient {
  private readonly provider: Provider;

  constructor(protected readonly options: RpcClientOptions) {
    this.provider = new Provider({
      rpc: {
        nodeUrl: this.baseUrl,
      },
    });
  }

  get baseUrl(): string {
    switch (this.options.chainId) {
      case constants.StarknetChainId.SN_MAIN:
        return `https://starknet-mainnet.infura.io/v3/${this.apiKey}`;
      default:
        return `https://starknet-sepolia.infura.io/v3/${this.apiKey}`;
    }
  }

  get apiKey(): string {
    return this.options.apiKey ?? '60c7253fb48147658095fe0460ac9ee9';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTxns(address: string): Promise<Transaction[]> {
    throw new DataClientError('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getDeployAccountTxn(address: string): Promise<Transaction> {
    throw new DataClientError('Method not implemented.');
  }

  async getTxn(hash: string): Promise<Transaction> {
    try {
      const receipt = await this.provider.getTransactionReceipt(hash);
      return {
        txnHash: receipt.transaction_hash,
        txnType: receipt['type'],
        chainId: this.options.chainId,
        senderAddress: '',
        contractAddress: '',
        contractFuncName: '',
        contractCallData: [],
        timestamp: 0,
        finalityStatus: receipt['finality_status'],
        executionStatus: receipt['execution_status'],
        failureReason: receipt['revert_reason'],
        eventIds: [],
      };
    } catch (e) {
      throw new DataClientError(e);
    }
  }
}
