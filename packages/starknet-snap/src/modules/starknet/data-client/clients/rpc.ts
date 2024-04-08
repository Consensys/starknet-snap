import { Provider, constants } from 'starknet';

import { IReadDataClient } from '../types';
import { Transaction } from '../../../../types/snapState';

export type RpcClientOptions = {
  chainId: string;
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
    try {
      switch (this.options.chainId) {
        case constants.StarknetChainId.SN_MAIN:
          return 'https://starknet-mainnet.infura.io/v3/60c7253fb48147658095fe0460ac9ee9';
        default:
          return 'https://starknet-sepolia.infura.io/v3/60c7253fb48147658095fe0460ac9ee9';
      }
    } catch (e) {
      console.log('baseUrl error', e.message);
    }
  }

  async getTxns(address: string): Promise<Transaction[]> {
    throw new Error('Method not implemented.');
  }

  async getDeployAccountTxn(address: string): Promise<Transaction> {
    throw new Error('Method not implemented.');
  }

  async getTxn(hash: string): Promise<Transaction> {
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
  }
}
