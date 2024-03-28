import { AccContract, MetaMaskProvider, Network, RequestSnapResponse } from './type';
import {
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
    abis?: Abi[] | undefined,
  ): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signTransaction',
          params: {
            signerAddress,
            transactions,
            transactionsDetail,
            abis: abis,
            ...(await this.#getSnapParams()),
          },
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
          params: {
            signerAddress,
            transaction,
            ...(await this.#getSnapParams()),
          },
        },
      },
    })) as Signature;
  }

  async signDeclareTransaction(signerAddress: string, transaction: DeclareSignerDetails): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signDeclareTransaction',
          params: {
            signerAddress,
            transaction,
            ...(await this.#getSnapParams()),
          },
        },
      },
    })) as Signature;
  }

  async execute(
    senderAddress: string,
    txnInvocation: AllowArray<Call>,
    abis?: Abi[] | undefined,
    invocationsDetails?: InvocationsDetails,
  ): Promise<InvokeFunctionResponse> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_executeTxn',
          params: {
            senderAddress,
            txnInvocation,
            abis,
            invocationsDetails,
            ...(await this.#getSnapParams()),
          },
        },
      },
    })) as InvokeFunctionResponse;
  }

  async deploy(
    senderAddress: string,
    txnInvocation: AllowArray<Call>,
    abis?: Abi[] | undefined,
    invocationsDetails?: InvocationsDetails,
  ): Promise<InvokeFunctionResponse> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_executeTxn',
          params: {
            senderAddress,
            txnInvocation,
            abis,
            invocationsDetails,
            ...(await this.#getSnapParams()),
          },
        },
      },
    })) as InvokeFunctionResponse;
  }

  async signMessage(typedDataMessage: TypedData, enableAutherize: boolean, signerAddress: string): Promise<Signature> {
    return (await this.#provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.#snapId,
        request: {
          method: 'starkNet_signMessage',
          params: {
            signerAddress,
            typedDataMessage,
            enableAutherize: enableAutherize,
            ...(await this.#getSnapParams()),
          },
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
          params: {
            senderAddress,
            contractPayload,
            invocationsDetails,
            ...(await this.#getSnapParams()),
          },
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
    })) as unknown as Network[];

    const network = response.find((n) => {
      return n.chainId === chainId;
    });

    return network;
  }

  async recoverDefaultAccount(chainId: string): Promise<AccContract> {
    const result = await this.recoverAccounts(chainId, 0, 1, 1);
    return result[0];
  }

  async recoverAccounts(
    chainId: string,
    startScanIndex = 0,
    maxScanned = 1,
    maxMissed = 1,
  ): Promise<Array<AccContract>> {
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
            debugLevel: 'all',
          },
        },
      },
    })) as Array<AccContract>;
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
            enableAutherize: true,
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
          params: {
            networkName: chainName,
            networkChainId: chainId,
            networkNodeUrl: rpcUrl,
            networkVoyagerUrl: explorerUrl,
          },
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
          params: {
            tokenAddress: address,
            tokenName: name,
            tokenSymbol: symbol,
            tokenDecimals: decimals,
          },
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
    })) as unknown as Network;

    return response;
  }

  async #getSnapParams() {
    const network = await this.getCurrentNetwork();
    return {
      chainId: network.chainId,
    };
  }

  static async GetProvider(window: { ethereum?: unknown }) {
    const { ethereum } = window;
    if (!ethereum) {
      return null;
    }
    let providers = [ethereum];

    //ethereum.detected or ethereum.providers may exist when more than 1 wallet installed
    if (ethereum.hasOwnProperty('detected')) {
      providers = ethereum['detected'];
    } else if (ethereum.hasOwnProperty('providers')) {
      providers = ethereum['providers'];
    }

    //delect provider by sending request
    for (const provider of providers) {
      if (provider && (await MetaMaskSnap.IsSupportSnap(provider as MetaMaskProvider))) {
        return provider;
      }
    }
    return null;
  }

  static async IsSupportSnap(provider: MetaMaskProvider) {
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
    if (!response || !response[this.#snapId]?.enabled) {
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
    } catch (err) {
      return false;
    }
  }
}
