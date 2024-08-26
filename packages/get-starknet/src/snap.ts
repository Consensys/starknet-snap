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

import type { AccContract, MetaMaskProvider, Network, RequestSnapResponse } from './type';

export class MetaMaskSnap {
  #provider: MetaMaskProvider;

  #snapId: string;

  #version: string;

  constructor(snapId: string, version: string, provider: MetaMaskProvider) {
    this.#provider = provider;
    this.#snapId = snapId;
    this.#version = version;
  }

  async getPubKey(userAddress: string): Promise<string> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_extractPublicKey',
          params: {
            userAddress,
            ...(await this.#getSnapParams()),
          },
        },
      },
    })) as string;
  }

  async signTransaction(
    signerAddress: string,
    transactions: Call[],
    transactionsDetail: InvocationsSignerDetails,
    abis?: Abi[],
  ): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signTransaction',
          params: this.removeUndefined({
            signerAddress,
            transactions,
            transactionsDetail,
            abis,
            ...(await this.#getSnapParams()),
          }),
        },
      },
    })) as Signature;
  }

  async signDeployAccountTransaction(
    signerAddress: string,
    transaction: DeployAccountSignerDetails,
  ): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signDeployAccountTransaction',
          params: this.removeUndefined({
            signerAddress,
            transaction,
            ...(await this.#getSnapParams()),
          }),
        },
      },
    })) as Signature;
  }

  async signDeclareTransaction(address: string, details: DeclareSignerDetails): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signDeclareTransaction',
          params: this.removeUndefined({
            address,
            details,
            ...(await this.#getSnapParams()),
          }),
        },
      },
    })) as Signature;
  }

  async execute(
    senderAddress: string,
    txnInvocation: AllowArray<Call>,
    abis?: Abi[],
    invocationsDetails?: InvocationsDetails,
  ): Promise<InvokeFunctionResponse> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_executeTxn',
          params: this.removeUndefined({
            senderAddress,
            txnInvocation,
            invocationsDetails,
            abis,
            ...(await this.#getSnapParams()),
          }),
        },
      },
    })) as InvokeFunctionResponse;
  }

  async signMessage(typedDataMessage: TypedData, enableAuthorize: boolean, signerAddress: string): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signMessage',
          params: this.removeUndefined({
            signerAddress,
            typedDataMessage,
            enableAuthorize,
            ...(await this.#getSnapParams()),
          }),
        },
      },
    })) as Signature;
  }

  async declare(
    senderAddress: string,
    contractPayload: DeclareContractPayload,
    invocationsDetails?: InvocationsDetails,
  ): Promise<DeclareContractResponse> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_declareContract',
          params: this.removeUndefined({
            senderAddress,
            contractPayload,
            invocationsDetails,
            ...(await this.#getSnapParams()),
          }),
        },
      },
    })) as DeclareContractResponse;
  }

  async getNetwork(chainId: string): Promise<Network | undefined> {
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

  async recoverDefaultAccount(chainId: string): Promise<AccContract> {
    const result = await this.recoverAccounts(chainId, 0, 1, 1);
    return result[0];
  }

  async recoverAccounts(chainId: string, startScanIndex = 0, maxScanned = 1, maxMissed = 1): Promise<AccContract[]> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_recoverAccounts',
          params: {
            startScanIndex,
            maxScanned,
            maxMissed,
            chainId,
          },
        },
      },
    })) as AccContract[];
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

  async addStarknetChain(chainName: string, chainId: string, rpcUrl: string, explorerUrl: string): Promise<boolean> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_addNetwork',
          params: this.removeUndefined({
            networkName: chainName,
            networkChainId: chainId,
            networkNodeUrl: rpcUrl,
            networkVoyagerUrl: explorerUrl,
          }),
        },
      },
    })) as boolean;
  }

  async watchAsset(address: string, name: string, symbol: string, decimals: number): Promise<boolean> {
    return this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_addErc20Token',
          params: this.removeUndefined({
            tokenAddress: address,
            tokenName: name,
            tokenSymbol: symbol,
            tokenDecimals: decimals,
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

  async #getSnapParams() {
    const network = await this.getCurrentNetwork();
    return {
      chainId: network.chainId,
    };
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

  async isInstalled() {
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

  removeUndefined(obj: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Object.fromEntries(Object.entries(obj).filter(([_, val]) => val !== undefined));
  }
}
