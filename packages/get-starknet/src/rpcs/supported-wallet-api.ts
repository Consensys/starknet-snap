import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { SupportedWalletApi } from '../constants';
import type { IStarknetWalletRpc } from '../utils/rpc';

export type WalletSupportedWalletApiMethod = 'wallet_supportedWalletApi';
type Result = RpcTypeToMessageMap[WalletSupportedWalletApiMethod]['result'];

export class WalletSupportedWalletApi implements IStarknetWalletRpc {
  async execute(): Promise<Result> {
    return SupportedWalletApi as unknown as Result;
  }
}
