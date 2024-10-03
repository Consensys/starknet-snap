import type { MutexInterface } from 'async-mutex';
import { Mutex } from 'async-mutex';
import { type RpcMessage, type WalletEvents, type StarknetWindowObject } from 'get-starknet-core';
import type { AccountInterface, ProviderInterface } from 'starknet';
import { Provider } from 'starknet';

import { MetaMaskAccount } from './accounts';
import { RpcMethod, WalletIconMetaData } from './constants';
import { WalletSwitchStarknetChain } from './rpcs';
import { MetaMaskSigner } from './signer';
import { MetaMaskSnap } from './snap';
import type { MetaMaskProvider, Network } from './type';
import type { IStarknetWalletRpc } from './utils';

export class MetaMaskSnapWallet implements StarknetWindowObject {
  id: string;

  name: string;

  version: string;

  icon: string;

  isConnected: boolean;

  snap: MetaMaskSnap;

  metamaskProvider: MetaMaskProvider;

  #rpcHandlers: Map<string, IStarknetWalletRpc>;

  #account: AccountInterface | undefined;

  #provider: ProviderInterface | undefined;

  #selectedAddress: string;

  #chainId: string;

  #network: Network;

  lock: MutexInterface;

  // eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-globals
  static readonly snapId = process.env.SNAP_ID ?? 'npm:@consensys/starknet-snap';

  constructor(metamaskProvider: MetaMaskProvider, snapVersion = '*') {
    this.id = 'metamask';
    this.name = 'Metamask';
    this.version = 'v2.0.0';
    this.icon = WalletIconMetaData;
    this.lock = new Mutex();
    this.metamaskProvider = metamaskProvider;
    this.snap = new MetaMaskSnap(MetaMaskSnapWallet.snapId, snapVersion, this.metamaskProvider);
    this.isConnected = false;

    this.#rpcHandlers = new Map<string, IStarknetWalletRpc>([
      [RpcMethod.WalletSwitchStarknetChain, new WalletSwitchStarknetChain(this)],
    ]);
  }

  async request<Data extends RpcMessage>(call: Omit<Data, 'result'>): Promise<Data['result']> {
    const { type, params } = call;

    const handler = this.#rpcHandlers.get(type);

    if (handler !== undefined) {
      return await handler.execute(params);
    }

    throw new Error(`Method not supported`);
  }

  async #getNetwork() {
    return await this.snap.getCurrentNetwork();
  }

  async #getWalletAddress(chainId: string) {
    const accountResponse = await this.snap.recoverDefaultAccount(chainId);

    if (!accountResponse?.address) {
      throw new Error('Unable to recover accounts');
    }

    return accountResponse.address;
  }

  get account() {
    if (!this.#account) {
      const signer = new MetaMaskSigner(this.snap, this.selectedAddress);

      this.#account = new MetaMaskAccount(this.snap, this.provider, this.selectedAddress, signer);
    }
    return this.#account;
  }

  get provider(): ProviderInterface {
    if (!this.#provider) {
      if (!this.#network) {
        throw new Error('Network is not set');
      }

      this.#provider = new Provider({
        nodeUrl: this.#network.nodeUrl,
      });
    }
    return this.#provider;
  }

  get selectedAddress(): string {
    return this.#selectedAddress;
  }

  get chainId(): string {
    return this.#chainId;
  }

  async setNetwork(network: Network) {
    if (!network) {
      throw new Error('Network cannot be undefined or null');
    }

    // in case of multiple calls to setNetwork, we need to ensure that only one call is in progress
    await this.lock.runExclusive(async () => {
      if (!this.#network || network.chainId !== this.#network.chainId) {
        // address is depends on network, if network changes, address will update
        this.#selectedAddress = await this.#getWalletAddress(network.chainId);
        // provider is depends on network.nodeUrl, if network changes, set provider to undefine for reinitialization
        this.#provider = undefined;
        // account is depends on address and provider, if network changes, address will update,
        // hence set account to undefine for reinitialization
        this.#account = undefined;
      }

      this.#network = network;
      this.#chainId = network.chainId;
    });
  }

  async enable() {
    await this.snap.installIfNot();

    this.isConnected = true;

    await this.setNetwork(await this.#getNetwork());

    return [this.selectedAddress];
  }

  async isPreauthorized() {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  on<Event extends WalletEvents>() {
    throw new Error('Method not supported');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  off<Event extends WalletEvents>() {
    throw new Error('Method not supported');
  }
}
