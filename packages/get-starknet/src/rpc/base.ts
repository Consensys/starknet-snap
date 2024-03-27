import { type RpcMessage } from 'get-starknet-core';

import { type RPCHandler } from './types';
import { MetaMaskSnap } from '../snap';
import { AccContract } from '../type';
import { MetaMaskSnapWalletState } from '../state';

export interface StaticRPCHandler {
  Instance: RPCHandler;
  new (snap: MetaMaskSnap, state: MetaMaskSnapWalletState): RPCHandler;
  GetInstance(this: StaticRPCHandler, snap: MetaMaskSnap, state: MetaMaskSnapWalletState): RPCHandler;
}

export abstract class BaseRPCHandler {
  static Instance: RPCHandler | null = null;
  installed = false;

  constructor(protected snap: MetaMaskSnap, protected state: MetaMaskSnapWalletState) {}

  async execute<T extends RpcMessage>(param?: T['params']): Promise<T['result']> {
    //always check if the snap has installed
    this.installed = await this.snap.installIfNot();
    return this.handleRequest(param);
  }

  protected async getAccount(): Promise<AccContract> {
    if (!this.state.account) {
      const network = await this.snap.getCurrentNetwork();
      const acc = await this.snap.recoverDefaultAccount(network.chainId);
      await this.state.setAccount(acc);
    }
    return this.state.account;
  }

  abstract handleRequest<T extends RpcMessage>(param?: T['params']): Promise<T['result']>;

  static GetInstance(this: StaticRPCHandler, snap: MetaMaskSnap, state: MetaMaskSnapWalletState): RPCHandler {
    if (this.Instance === null) {
      this.Instance = new this(snap, state);
    }
    return this.Instance;
  }
}
