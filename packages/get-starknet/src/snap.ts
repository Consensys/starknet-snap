import semver from 'semver/preload';
import type {
  Abi,
  AllowArray,
  Call,
  DeclareContractPayload,
  DeclareContractResponse,
  DeclareSignerDetails,
  DeployAccountSignerDetails,
  InvocationsDetails,
  InvocationsSignerDetails,
  InvokeFunctionResponse,
  Signature,
  TypedData,
} from 'starknet';

import type {
  AccContract,
  DeploymentData,
  MetaMaskProvider,
  Network,
  RequestSnapResponse,
  SnapsMetaData,
} from './type';

export class MetaMaskSnap {
  /**
   * The wallet RPC provider.
   */
  #provider: MetaMaskProvider;

  /**
   * The ID of the SNAP.
   */
  #snapId: string;

  /**
   * The version of the SNAP to install.
   */
  #version: string;

  /**
   * The minimum version of the SNAP.
   * If the installed version is lower than this version, the SNAP will be updated.
   */
  #minSnapVersion: string;

  constructor(snapId: string, version: string, provider: MetaMaskProvider, minSnapVersion?: string) {
    this.#provider = provider;
    this.#snapId = snapId;
    this.#version = version;
    // unless specified, the minSnapVersion is the same as the snapVersion
    this.#minSnapVersion = minSnapVersion ?? version;
  }

  async getPubKey({ userAddress, chainId }: { userAddress: string; chainId?: string }): Promise<string> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_extractPublicKey',
          params: await this.#getSnapParams({
            userAddress,
            chainId,
          }),
        },
      },
    })) as string;
  }

  async signTransaction({
    address,
    transactions,
    transactionsDetail,
    chainId,
  }: {
    address: string;
    transactions: Call[];
    transactionsDetail: InvocationsSignerDetails;
    chainId?: string;
  }): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signTransaction',
          params: await this.#getSnapParams({
            address,
            transactions,
            transactionsDetail,
            chainId,
          }),
        },
      },
    })) as Signature;
  }

  async signDeployAccountTransaction({
    signerAddress,
    transaction,
    chainId,
  }: {
    signerAddress: string;
    transaction: DeployAccountSignerDetails;
    chainId?: string;
  }): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signDeployAccountTransaction',
          params: await this.#getSnapParams({
            signerAddress,
            transaction,
            chainId,
          }),
        },
      },
    })) as Signature;
  }

  async signDeclareTransaction({
    address,
    details,
    chainId,
  }: {
    address: string;
    details: DeclareSignerDetails;
    chainId?: string;
  }): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signDeclareTransaction',
          params: await this.#getSnapParams({
            address,
            details,
            chainId,
          }),
        },
      },
    })) as Signature;
  }

  async execute({
    address,
    calls,
    abis,
    details,
    chainId,
  }: {
    address: string;
    calls: AllowArray<Call>;
    abis?: Abi[];
    details?: InvocationsDetails;
    chainId?: string;
  }): Promise<InvokeFunctionResponse> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_executeTxn',
          params: await this.#getSnapParams({
            address,
            calls,
            details,
            abis,
            chainId,
          }),
        },
      },
    })) as InvokeFunctionResponse;
  }

  async signMessage({
    typedDataMessage,
    enableAuthorize,
    address,
    chainId,
  }: {
    typedDataMessage: TypedData;
    enableAuthorize: boolean;
    address: string;
    chainId?: string;
  }): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signMessage',
          params: await this.#getSnapParams({
            address,
            typedDataMessage,
            enableAuthorize,
            chainId,
          }),
        },
      },
    })) as Signature;
  }

  async declare({
    senderAddress,
    contractPayload,
    invocationsDetails,
    chainId,
  }: {
    senderAddress: string;
    contractPayload: DeclareContractPayload;
    invocationsDetails?: InvocationsDetails;
    chainId?: string;
  }): Promise<DeclareContractResponse> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_declareContract',
          params: await this.#getSnapParams({
            senderAddress,
            contractPayload,
            invocationsDetails,
            chainId,
          }),
        },
      },
    })) as DeclareContractResponse;
  }

  // Method will be deprecated, replaced by get current network
  async getNetwork(chainId): Promise<Network | undefined> {
    const response = (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_getStoredNetworks',
          params: {},
        },
      },
    })) as Network[];

    const network = response.find((item) => {
      return item.chainId === chainId;
    });

    return network;
  }

  async getCurrentAccount({ chainId, fromState }: { chainId?: string; fromState?: boolean }): Promise<AccContract> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_getCurrentAccount',
          params: await this.#getSnapParams({
            chainId,
            fromState,
          }),
        },
      },
    })) as AccContract;
  }

  async switchNetwork(chainId: string): Promise<boolean> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_switchNetwork',
          params: {
            chainId,
            enableAuthorize: true,
          },
        },
      },
    })) as boolean;
  }

  // Method to be deprecated, no longer supported
  async addStarknetChain({
    chainName,
    chainId,
    rpcUrl,
    explorerUrl,
  }: {
    chainName: string;
    chainId: string;
    rpcUrl: string;
    explorerUrl: string;
  }): Promise<boolean> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_addNetwork',
          params: this.#removeUndefined({
            networkName: chainName,
            networkChainId: chainId,
            networkNodeUrl: rpcUrl,
            networkVoyagerUrl: explorerUrl,
          }),
        },
      },
    })) as boolean;
  }

  async watchAsset({
    address,
    name,
    symbol,
    decimals,
    chainId,
  }: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    chainId?: string;
  }): Promise<boolean> {
    return this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_addErc20Token',
          params: await this.#getSnapParams({
            tokenAddress: address,
            tokenName: name,
            tokenSymbol: symbol,
            tokenDecimals: decimals,
            chainId,
          }),
        },
      },
    }) as unknown as boolean;
  }

  async getCurrentNetwork(): Promise<Network> {
    const response = (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_getCurrentNetwork',
          params: {},
        },
      },
    })) as Network;

    return response;
  }

  async getDeploymentData({ chainId, address }: { chainId: string; address: string }): Promise<DeploymentData> {
    const response = (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_getDeploymentData',
          params: {
            chainId,
            address,
          },
        },
      },
    })) as DeploymentData;

    return response;
  }

  async #getSnapParams(params: Record<string, unknown> & { chainId?: string }): Promise<Record<string, unknown>> {
    return this.#removeUndefined({
      ...params,
      chainId: params.chainId ?? (await this.getCurrentNetwork()).chainId,
    });
  }

  static async getProvider(window: {
    ethereum?: {
      detected?: MetaMaskProvider[];
      providers?: MetaMaskProvider[];
    };
  }) {
    const { ethereum } = window;
    if (!ethereum) {
      return null;
    }
    let providers: MetaMaskProvider[] = [ethereum as unknown as MetaMaskProvider];

    // ethereum.detected or ethereum.providers may exist when more than 1 wallet installed

    if (Object.prototype.hasOwnProperty.call(ethereum, 'detected')) {
      providers = ethereum.detected as unknown as MetaMaskProvider[];
    } else if (Object.prototype.hasOwnProperty.call(ethereum, 'providers')) {
      providers = ethereum.providers as unknown as MetaMaskProvider[];
    }

    // detect provider by sending request
    for (const provider of providers) {
      if (provider && (await MetaMaskSnap.isSupportSnap(provider))) {
        return provider;
      }
    }
    return null;
  }

  static async isSupportSnap(provider: MetaMaskProvider) {
    try {
      await provider.request({
        method: 'wallet_getSnaps',
      });
      return true;
    } catch {
      return false;
    }
  }

  async installIfNot(): Promise<boolean> {
    if ((await this.isInstalled()) && !(await this.isSnapRequireUpdate())) {
      return true;
    }
    // `wallet_requestSnaps` will force the SNAP to reconnect,
    // If the SNAP is not installed, it will be installed
    // If the SNAP is installed, it will update the SNAP if the version is different
    const response = (await this.#provider.request({
      method: 'wallet_requestSnaps',
      params: {
        [this.#snapId]: { version: this.#version },
      },
    })) as RequestSnapResponse;

    if (!response?.[this.#snapId]?.enabled) {
      return false;
    }
    return true;
  }

  protected async isInstalled(): Promise<boolean> {
    try {
      await this.#provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: this.#snapId,
          request: {
            method: 'ping',
          },
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  #removeUndefined(obj: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Object.fromEntries(Object.entries(obj).filter(([_, val]) => val !== undefined));
  }

  protected async getInstalledSnaps(): Promise<SnapsMetaData> {
    return (await this.#provider.request({ method: 'wallet_getSnaps' })) as SnapsMetaData;
  }

  protected async isSnapRequireUpdate(): Promise<boolean> {
    const snaps = await this.getInstalledSnaps();

    if (typeof snaps[this.#snapId]?.version !== 'undefined') {
      // if the minSnapVersion is *, we should always allowed
      if (this.#minSnapVersion === '*') {
        return false;
      }

      const currentVersion = snaps[this.#snapId]?.version.split('-')?.[0];

      return semver.lt(currentVersion, this.#minSnapVersion);
    }

    return false;
  }
}
