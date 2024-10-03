import type { RpcMessage, RpcTypeToMessageMap } from 'get-starknet-core';

import type { MetaMaskSnap } from '../snap';
import type { MetaMaskSnapWallet } from '../wallet';

export type IStarknetWalletRpc = {
  // handleRequest<Response>(param: unknown): Promise<Response>;
  execute<Rpc extends RpcMessage['type']>(
    params: RpcTypeToMessageMap[Rpc]['params'],
  ): Promise<RpcTypeToMessageMap[Rpc]['result']>;
};

export abstract class StarknetWalletRpc implements IStarknetWalletRpc {
  protected snap: MetaMaskSnap;

  protected wallet: MetaMaskSnapWallet;

  protected installed = false;

  constructor(wallet: MetaMaskSnapWallet) {
    this.snap = wallet.snap;
    this.wallet = wallet;
  }

  async execute<Rpc extends RpcMessage['type']>(
    param?: RpcTypeToMessageMap[Rpc]['params'],
  ): Promise<RpcTypeToMessageMap[Rpc]['result']> {
    // Always check if the snap has installed
    this.installed = await this.snap.installIfNot();

    return this.handleRequest(param);
  }

  abstract handleRequest<Rpc extends RpcMessage['type']>(
    params: RpcTypeToMessageMap[Rpc]['params'],
  ): Promise<RpcTypeToMessageMap[Rpc]['result']>;
}
