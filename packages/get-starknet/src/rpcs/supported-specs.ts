import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { SupportedStarknetSpecVersion } from '../constants';
import { StarknetWalletRpc } from '../utils/rpc';

export type WalletSupportedSpecsMethod = 'wallet_supportedSpecs';
type Params = RpcTypeToMessageMap[WalletSupportedSpecsMethod]['params'];
type Result = RpcTypeToMessageMap[WalletSupportedSpecsMethod]['result'];

export class WalletSupportedSpecs extends StarknetWalletRpc {
  async handleRequest(_param: Params): Promise<Result> {
    return SupportedStarknetSpecVersion;
  }
}
