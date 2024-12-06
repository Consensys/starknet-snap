import type { MutexInterface } from 'async-mutex';
import { Mutex } from 'async-mutex';
import type { AccountChangeEventHandler, NetworkChangeEventHandler, WalletEventHandlers } from 'get-starknet-core';
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

  #latestAddress: string;

  #chainId: string;

  #network: Network;

  lock: MutexInterface;

  #pollingController: AbortController | undefined;

  #accountChangeHandlers: AccountChangeEventHandler[] = [];

  #networkChangeHandlers: NetworkChangeEventHandler[] = [];

  static readonly minimumPollingDelay = 100;

  static readonly maximumPollingDelay = 5000;

  // eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-globals
  static readonly snapId = process.env.SNAP_ID ?? 'npm:@consensys/starknet-snap';

  // eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-globals
  static readonly snapVersion = process.env.SNAP_VERSION ?? '*';

  /**
   * Initializes a new instance of the MetaMaskSnapWallet class.
   *
   * The Snap version is now enforced globally via a static `snapVersion` property,
   * this ensures consistent versioning across all instances and removes the need for consumers to specify it.
   *
   * @param metamaskProvider - The MetaMask Wallet Provider.
   * @param _snapVersion - The `_snapVersion` parameter remains to maintain compatibility with existing usage.
   */
  constructor(metamaskProvider: MetaMaskProvider, _snapVersion = '*') {
    this.id = 'metamask';
    this.name = 'Metamask';
    this.version = 'v2.0.0';
    this.icon = WalletIconMetaData;
    this.lock = new Mutex();
    this.metamaskProvider = metamaskProvider;
    this.snap = new MetaMaskSnap(MetaMaskSnapWallet.snapId, MetaMaskSnapWallet.snapVersion, this.metamaskProvider);
    this.isConnected = false;
    this.#latestAddress = '0x';

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
      // TODO : This should be removed. The walletAccount is created with the SWO as input.
      // This means account is not managed from within the SWO but from outside.
      // Event handling helps ensure that the correct address is set.
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

  /**
   * Registers an event handler for `accountsChanged` or `networkChanged`.
   *
   * @param event - The event name ('accountsChanged' or 'networkChanged')
   * @param handleEvent - The event handler function
   */
  on<Event extends keyof WalletEventHandlers>(event: Event, handleEvent: WalletEventHandlers[Event]): void {
    if (!this.#pollingController) {
      this.#startPolling();
    }

    if (event === 'accountsChanged') {
      this.#accountChangeHandlers.push(handleEvent as AccountChangeEventHandler);
    } else if (event === 'networkChanged') {
      this.#networkChangeHandlers.push(handleEvent as NetworkChangeEventHandler);
    } else {
      throw new Error(`Unsupported event: ${String(event)}`);
    }
  }

  /**
   * Removes an event handler for `accountsChanged` or `networkChanged`.
   *
   * @param event - The event name ('accountsChanged' or 'networkChanged')
   * @param _handleEvent
   */
  off<Event extends keyof WalletEventHandlers>(event: Event, _handleEvent?: WalletEventHandlers[Event]): void {
    if (event === 'accountsChanged') {
      this.#accountChangeHandlers = [];
    } else if (event === 'networkChanged') {
      this.#networkChangeHandlers = [];
    } else {
      throw new Error(`Unsupported event: ${String(event)}`);
    }

    if (this.#accountChangeHandlers.length === 0 && this.#networkChangeHandlers.length === 0) {
      this.#stopPolling();
    }
  }

  /**
   * Polling function for detecting changes with a maximum delay.
   * Ensures that each iteration respects a maximum delay before proceeding.
   */
  #pollingFunction = async (): Promise<void> => {
    if (!this.#pollingController) {
      return; // Abort if the polling controller is not initialized
    }
    const { signal } = this.#pollingController;

    while (!signal.aborted) {
      const startTime = Date.now(); // Track the start time of the iteration
      const previousNetwork = this.#network;
      const previousAddress = this.#latestAddress;

      try {
        // Perform the polling operation with a timeout
        await Promise.race([
          this.#init(), // Perform the main operation
          new Promise(
            (_, reject) =>
              setTimeout(() => reject(new Error('Polling timeout exceeded')), MetaMaskSnapWallet.maximumPollingDelay), // Timeout after 5 seconds
          ),
        ]);

        // Check for network change
        if (previousNetwork.chainId !== this.#network.chainId) {
          this.#networkChangeHandlers.forEach((callback) => callback(this.#network.chainId, [this.#selectedAddress]));
        }

        // Check for account change
        if (previousAddress !== this.#selectedAddress) {
          this.#accountChangeHandlers.forEach((callback) => callback([this.#selectedAddress]));
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error('Error in polling:', error.message);
        }
      }

      // Calculate remaining time for minimum delay
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MetaMaskSnapWallet.minimumPollingDelay - elapsedTime); // Ensure a minimum delay of 100ms
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
    }
  };

  #startPolling(): void {
    this.#pollingController = new AbortController();
    this.#pollingFunction().catch((error) => {
      if (!this.#pollingController?.signal.aborted) {
        console.error('Error in polling:', error);
      }
    });
  }

  #stopPolling(): void {
    if (this.#pollingController) {
      this.#pollingController.abort();
      this.#pollingController = undefined;
    }
  }
}
