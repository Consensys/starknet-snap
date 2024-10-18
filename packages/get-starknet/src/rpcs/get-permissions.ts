import { Permission, type RpcTypeToMessageMap } from 'get-starknet-core';

import { StarknetWalletRpc } from '../utils/rpc';

export type WalletGetPermissionsMethod = 'wallet_getPermissions';
type Params = RpcTypeToMessageMap[WalletGetPermissionsMethod]['params'];
type Result = RpcTypeToMessageMap[WalletGetPermissionsMethod]['result'];

export class WalletGetPermissions extends StarknetWalletRpc {
  async handleRequest(_param: Params): Promise<Result> {
    return [Permission.ACCOUNTS];
  }
}
