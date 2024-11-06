import type { MutexInterface } from 'async-mutex';
import { Mutex } from 'async-mutex';
import type { WalletEventHandlers } from 'get-starknet-core';
import { type RpcMessage, type StarknetWindowObject } from 'get-starknet-core';
import type { AccountInterface, ProviderInterface } from 'starknet';
import { Provider } from 'starknet';

import { MetaMaskAccount } from './accounts';
import { RpcMethod, WalletIconMetaData } from './constants';
import {
  WalletSupportedSpecs,
  WalletSupportedWalletApi,
  WalletSwitchStarknetChain,
  WalletDeploymentData,
  WalletRequestAccount,
  WalletAddInvokeTransaction,
  WalletRequestChainId,
  WalletWatchAsset,
  WalletSignTypedData,
  WalletGetPermissions,
  WalletAddDeclareTransaction,
} from './rpcs';
import { MetaMaskSigner } from './signer';
import { MetaMaskSnap } from './snap';
import type { MetaMaskProvider, Network } from './type';
import type { IStarknetWalletRpc } from './utils';
import { WalletRpcError, WalletRpcErrorCode } from './utils/error';

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
      [RpcMethod.WalletSupportedSpecs, new WalletSupportedSpecs()],
      [RpcMethod.WalletDeploymentData, new WalletDeploymentData(this)],
      [RpcMethod.WalletSupportedWalletApi, new WalletSupportedWalletApi()],
      [RpcMethod.WalletRequestAccounts, new WalletRequestAccount(this)],
      [RpcMethod.WalletRequestChainId, new WalletRequestChainId(this)],
      [RpcMethod.WalletAddInvokeTransaction, new WalletAddInvokeTransaction(this)],
      [RpcMethod.WalletWatchAsset, new WalletWatchAsset(this)],
      [RpcMethod.WalletSignTypedData, new WalletSignTypedData(this)],
      [RpcMethod.WalletGetPermissions, new WalletGetPermissions()],
      [RpcMethod.WalletAddDeclareTransaction, new WalletAddDeclareTransaction(this)],
    ]);
  }

  /**
   * Execute the Wallet RPC request.
   * It will call the corresponding RPC handler based on the request type.
   *
   * @param call - The RPC request object.
   * @returns The corresponding RPC response.
   */
  async request<Data extends RpcMessage>(call: Omit<Data, 'result'>): Promise<Data['result']> {
    const { type, params } = call;

    const handler = this.#rpcHandlers.get(type);

    if (handler !== undefined) {
      return await handler.execute(params);
    }

    throw new WalletRpcError(`Method not supported`, WalletRpcErrorCode.Unknown);
  }

  async #getNetwork(): Promise<Network> {
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
      if (!this.selectedAddress) {
        throw new Error('Address is not set');
      }

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

  /**
   * Initializes the wallet by fetching the network and account information.
   * and sets the network, address, account object and provider object.
   *
   * @param createLock - The flag to enable/disable the mutex lock. Default is true.
   */
  async init(createLock = true) {
    if (createLock) {
      await this.lock.runExclusive(async () => {
        await this.#init();
      });
    } else {
      await this.#init();
    }
  }

  async #init() {
    // Always reject any request if the snap is not installed
    if (!(await this.snap.installIfNot())) {
      throw new Error('Snap is not installed');
    }

    const network = await this.#getNetwork();
    if (!network) {
      throw new Error('Unable to find the selected network');
    }

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
    this.isConnected = true;
  }

  /**
   * Initializes the `MetaMaskSnapWallet` object and retrieves an array of addresses derived from Snap.
   * Currently, the array contains only one address, but it is returned as an array to
   * accommodate potential support for multiple addresses in the future.
   *
   * @returns An array of address.
   */
  async enable() {
    await this.init();
    return [this.selectedAddress];
  }

  async isPreauthorized() {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  on<Event extends keyof WalletEventHandlers>(_event: Event, _handleEvent: WalletEventHandlers[Event]): void {
    // No operation for now
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  off<Event extends keyof WalletEventHandlers>(_event: Event, _handleEvent?: WalletEventHandlers[Event]): void {
    // No operation for now
  }
}
