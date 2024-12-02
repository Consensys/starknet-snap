import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { StarknetWalletRpc } from '../utils/rpc';

export type WalletRequestChainIdMethod = 'wallet_requestChainId';
type Result = RpcTypeToMessageMap[WalletRequestChainIdMethod]['result'];

export class WalletRequestChainId extends StarknetWalletRpc {
  async handleRequest(): Promise<Result> {
    return this.wallet.chainId;
  }
}
