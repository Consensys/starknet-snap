import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { SupportedWalletApi } from '../constants';
import { StarknetWalletRpc } from '../utils/rpc';

export type WalletSupportedWalletApiMethod = 'wallet_supportedWalletApi';
type Params = RpcTypeToMessageMap[WalletSupportedWalletApiMethod]['params'];
type Result = RpcTypeToMessageMap[WalletSupportedWalletApiMethod]['result'];

export class WalletSupportedWalletApi extends StarknetWalletRpc {
  async handleRequest(_param: Params): Promise<Result> {
    return SupportedWalletApi;
  }
}
