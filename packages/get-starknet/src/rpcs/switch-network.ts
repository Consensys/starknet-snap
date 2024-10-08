import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { StarknetWalletRpc } from '../utils/rpc';

export type WalletSwitchStarknetChainMethod = 'wallet_switchStarknetChain';
type Params = RpcTypeToMessageMap[WalletSwitchStarknetChainMethod]['params'];
type Result = RpcTypeToMessageMap[WalletSwitchStarknetChainMethod]['result'];

export class WalletSwitchStarknetChain extends StarknetWalletRpc {
  async handleRequest(param: Params): Promise<Result> {
    try {
      // The wallet.chainid should always refer to the latest snap chain id
      // reference: MetaMaskSnapWallet.init
      if (this.wallet.chainId === param.chainId) {
        return true;
      }

      await this.snap.switchNetwork(param.chainId);

      await this.wallet.init();

      return true;
    } catch (error) {
      return false;
    }
  }
}
