import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { StarknetWalletRpc } from '../utils/rpc';

export type WalletDeploymentDataMethod = 'wallet_deploymentData';
type Params = RpcTypeToMessageMap[WalletDeploymentDataMethod]['params'];
type Result = RpcTypeToMessageMap[WalletDeploymentDataMethod]['result'];

export class WalletDeploymentData extends StarknetWalletRpc {
  async handleRequest(_param: Params): Promise<Result> {
    return await this.snap.getDeploymentData({
      chainId: this.wallet.chainId,
      address: this.wallet.selectedAddress,
    });
  }
}
