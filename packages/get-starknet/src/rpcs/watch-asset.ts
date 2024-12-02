import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { StarknetWalletRpc } from '../utils/rpc';

export type WalletWatchAssetMethod = 'wallet_watchAsset';
type Params = RpcTypeToMessageMap[WalletWatchAssetMethod]['params'];
type Result = RpcTypeToMessageMap[WalletWatchAssetMethod]['result'];

export class WalletWatchAsset extends StarknetWalletRpc {
  async handleRequest(params: Params): Promise<Result> {
    const { address, symbol, decimals, name } = params.options;

    // All parameters are required in the snap,
    // However, some are optional in get-starknet framework.
    // Therefore, we assigned default values to bypass the type issue, and let the snap throw the validation error.
    return (await this.snap.watchAsset({
      address,
      symbol: symbol ?? '',
      decimals: decimals ?? 0,
      name: name ?? '',
      chainId: this.wallet.chainId,
    })) as unknown as Result;
  }
}
