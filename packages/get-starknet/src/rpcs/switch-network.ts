import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { StarknetWalletRpc } from '../utils/rpc';

export type WalletSwitchStarknetChainMethod = 'wallet_switchStarknetChain';
type Params = RpcTypeToMessageMap[WalletSwitchStarknetChainMethod]['params'];
type Result = RpcTypeToMessageMap[WalletSwitchStarknetChainMethod]['result'];

export class WalletSwitchStarknetChain extends StarknetWalletRpc {
  async handleRequest(param: Params): Promise<Result> {
    try {
      const network = await this.snap.getCurrentNetwork();

      if (network.chainId === param.chainId) {
        return true;
      }

      await this.snap.switchNetwork(param.chainId);

      await this.wallet.setNetwork(network);

      return true;
    } catch (error) {
      return false;
    }
  }
}
