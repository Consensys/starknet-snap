import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { StarknetWalletRpc } from '../utils/rpc';

export type WalletRequestAccountMethod = 'wallet_requestAccounts';
type Result = RpcTypeToMessageMap[WalletRequestAccountMethod]['result'];

export class WalletRequestAccount extends StarknetWalletRpc {
  async handleRequest(): Promise<Result> {
    return [this.wallet.selectedAddress];
  }
}
