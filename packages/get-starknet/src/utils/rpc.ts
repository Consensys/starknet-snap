import type { RpcMessage, RpcTypeToMessageMap } from 'get-starknet-core';

import type { MetaMaskSnap } from '../snap';
import type { MetaMaskSnapWallet } from '../wallet';
import { createStarkError } from './error';

export type IStarknetWalletRpc = {
  execute<Rpc extends RpcMessage['type']>(
    params: RpcTypeToMessageMap[Rpc]['params'],
  ): Promise<RpcTypeToMessageMap[Rpc]['result']>;
};

export abstract class StarknetWalletRpc implements IStarknetWalletRpc {
  protected snap: MetaMaskSnap;

  protected wallet: MetaMaskSnapWallet;

  constructor(wallet: MetaMaskSnapWallet) {
    this.snap = wallet.snap;
    this.wallet = wallet;
  }

  async execute<Rpc extends RpcMessage['type']>(
    params?: RpcTypeToMessageMap[Rpc]['params'],
  ): Promise<RpcTypeToMessageMap[Rpc]['result']> {
    try {
      await this.wallet.init(false);
      return await this.handleRequest(params);
    } catch (error) {
      throw createStarkError(error?.data?.walletRpcError?.code);
    }
  }

  abstract handleRequest<Rpc extends RpcMessage['type']>(
    params: RpcTypeToMessageMap[Rpc]['params'],
  ): Promise<RpcTypeToMessageMap[Rpc]['result']>;
}
