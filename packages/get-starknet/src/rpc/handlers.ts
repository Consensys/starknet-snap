import {
  type SwitchStarknetChainParameters,
  type AddStarknetChainParameters,
  type WatchAssetParameters,
  type AddDeclareTransactionParameters,
  type AddInvokeTransactionParameters,
  type AddInvokeTransactionResult,
  type TypedData,
  type Permission,
  type StarknetChainId,
  type GetDeploymentDataResult,
  type AddDeclareTransactionResult,
} from 'get-starknet-core';

import { type CompiledContract, type Call } from 'starknet';

import { StaticImplements } from './types';
import { BaseRPCHandler, StaticRPCHandler } from './base';

export class WalletSwitchStarknetChain
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof WalletSwitchStarknetChain>
{
  async handleRequest(param: SwitchStarknetChainParameters): Promise<boolean> {
    if (!this.installed) {
      throw new Error('Wallet not authorized');
    }
    try {
      const network = await this.snap.getCurrentNetwork();
      if (network.chainId === param.chainId) {
        return true;
      }
      return this.snap.switchNetwork(param.chainId);
    } catch (e) {
      return false;
    }
  }
}

export class WalletAddStarknetChain
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof WalletAddStarknetChain>
{
  async handleRequest(param: AddStarknetChainParameters): Promise<boolean> {
    if (!this.installed) {
      throw new Error('Wallet not authorized');
    }
    try {
      return this.snap.addStarknetChain(
        param.chainName,
        param.chainId,
        param.rpcUrls ? param.rpcUrls[0] : '',
        param.blockExplorerUrls ? param.blockExplorerUrls[0] : '',
      );
    } catch (e) {
      return false;
    }
  }
}

export class WalletWatchAsset
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof WalletWatchAsset>
{
  async handleRequest(param: WatchAssetParameters): Promise<boolean> {
    if (!this.installed) {
      throw new Error('Wallet not authorized');
    }
    try {
      return this.snap.watchAsset(
        param.options.address,
        param.options.name,
        param.options.symbol,
        param.options.decimals,
      );
    } catch (e) {
      return false;
    }
  }
}

export class WalletGetPermissions
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof WalletGetPermissions>
{
  async handleRequest(): Promise<Permission[]> {
    if (!this.installed) {
      return [];
    }
    return ['accounts'] as unknown as Permission[];
  }
}

export class WalletRequestAccounts
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof WalletRequestAccounts>
{
  async handleRequest(): Promise<string[]> {
    if (!this.installed) {
      return [];
    }
    const account = await this.getAccount();
    return [account.address];
  }
}

export class WalletRequestChainId
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof WalletRequestChainId>
{
  async handleRequest(): Promise<StarknetChainId> {
    if (!this.installed) {
      throw new Error('Wallet not authorized');
    }
    const network = await this.snap.getCurrentNetwork();
    return network.chainId as StarknetChainId;
  }
}

export class WalletDeploymentData
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof WalletDeploymentData>
{
  async handleRequest(): Promise<GetDeploymentDataResult> {
    if (!this.installed) {
      throw new Error('Wallet not authorized');
    }

    const account = await this.getAccount();
    return {
      address: account.address,
      class_hash: '',
      salt: account.addressSalt,
      calldata: [],
      version: 0,
    };
  }
}

export class StarknetAddInvokeTransaction
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof StarknetAddInvokeTransaction>
{
  async handleRequest(param: AddInvokeTransactionParameters): Promise<AddInvokeTransactionResult> {
    if (!this.installed) {
      throw new Error('Wallet not authorized');
    }
    const account = await this.getAccount();
    try {
      const result = this.snap.execute(account.address, param.calls as unknown as Call[]);
      if (!result) {
        throw new Error('Invoke transaction rejected');
      }
      return result;
    } catch (e) {
      throw e;
    }
  }
}

export class StarknetAddDeclareTransaction
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof StarknetAddDeclareTransaction>
{
  async handleRequest(param: AddDeclareTransactionParameters): Promise<AddDeclareTransactionResult> {
    if (!this.installed) {
      throw new Error('Wallet not authorized');
    }
    const account = await this.getAccount();
    try {
      const result = this.snap.declare(account.address, {
        contract: param.contract_class as unknown as CompiledContract,
        classHash: param.compiled_class_hash,
      });
      if (!result) {
        throw new Error('Declare transaction rejected');
      }
      return result;
    } catch (e) {
      throw e;
    }
  }
}

export class StarknetSignTypedData
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof StarknetSignTypedData>
{
  async handleRequest(param: TypedData): Promise<string[]> {
    if (!this.installed) {
      throw new Error('Wallet not authorized');
    }
    try {
      const account = await this.getAccount();
      const result = this.snap.signMessage(param, true, account.address) as unknown as string[];
      if (!result) {
        throw new Error('Sign TypedData rejected');
      }
      return result;
    } catch (e) {
      throw e;
    }
  }
}

export class StarknetSupportedSpecs
  extends BaseRPCHandler
  implements StaticImplements<StaticRPCHandler, typeof StarknetSignTypedData>
{
  async handleRequest(): Promise<string[]> {
    return ['0.4', '0.5'];
  }
}
