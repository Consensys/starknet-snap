import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { SupportedStarknetSpecVersion } from '../constants';
import type { IStarknetWalletRpc } from '../utils';

export type WalletSupportedSpecsMethod = 'wallet_supportedSpecs';
type Result = RpcTypeToMessageMap[WalletSupportedSpecsMethod]['result'];

export class WalletSupportedSpecs implements IStarknetWalletRpc {
  async execute(): Promise<Result> {
    return SupportedStarknetSpecVersion;
  }
}
