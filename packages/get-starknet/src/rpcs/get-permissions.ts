import { Permission, type RpcTypeToMessageMap } from 'get-starknet-core';

import type { IStarknetWalletRpc } from '../utils/rpc';

export type WalletGetPermissionsMethod = 'wallet_getPermissions';
type Result = RpcTypeToMessageMap[WalletGetPermissionsMethod]['result'];

export class WalletGetPermissions implements IStarknetWalletRpc {
  async execute(): Promise<Result> {
    return [Permission.ACCOUNTS];
  }
}
