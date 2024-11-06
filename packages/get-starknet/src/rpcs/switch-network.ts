import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { createStarkError } from '../utils/error';
import { StarknetWalletRpc } from '../utils/rpc';

export type WalletSwitchStarknetChainMethod = 'wallet_switchStarknetChain';
type Params = RpcTypeToMessageMap[WalletSwitchStarknetChainMethod]['params'];
type Result = RpcTypeToMessageMap[WalletSwitchStarknetChainMethod]['result'];

export class WalletSwitchStarknetChain extends StarknetWalletRpc {
  async execute(params: Params): Promise<Result> {
    // Adding a lock can make sure the switching network process can only process once at a time with get-starknet,
    // For cross dapp switching network, which already handle by the snap,
    // Example scenario:
    // [Rq1] wallet init and send switch network B request to snap at T0
    // [Rq2] wallet init and send switch network B request to snap at T1 <-- this request will be on hold by the lock
    // [Rq1] confrim request and network switch to B, assign local chain Id to B at T2
    // [Rq2] lock release, wallet inited and local chainId is B, which is same as request, so we return true directly at T3
    try {
      return await this.wallet.lock.runExclusive(async () => {
        await this.wallet.init(false);
        return this.handleRequest(params);
      });
    } catch (error) {
      throw createStarkError(error?.data?.walletRpcError?.code);
    }
  }

  async handleRequest(param: Params): Promise<Result> {
    const { chainId } = param;

    // The wallet.chainId always refer to the latest chainId of the snap
    if (this.wallet.chainId === chainId) {
      return true;
    }

    const result = await this.snap.switchNetwork(chainId);
    // after switching the network,
    // we need to re-init the wallet object to assign the latest chainId into it
    await this.wallet.init(false);

    return result;
  }
}
