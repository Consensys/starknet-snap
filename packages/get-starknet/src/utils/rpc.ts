import type { RpcMessage, RpcTypeToMessageMap } from 'get-starknet-core';

import type { MetaMaskSnap } from '../snap';
import type { MetaMaskSnapWallet } from '../wallet';

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
    await this.wallet.init();

    return this.handleRequest(params);
  }

  abstract handleRequest<Rpc extends RpcMessage['type']>(
    params: RpcTypeToMessageMap[Rpc]['params'],
  ): Promise<RpcTypeToMessageMap[Rpc]['result']>;
}
