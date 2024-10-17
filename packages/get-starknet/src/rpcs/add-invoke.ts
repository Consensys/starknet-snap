import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { StarknetWalletRpc } from '../utils/rpc';

export type WalletAddInvokeTransactionMethod = 'wallet_addInvokeTransaction';
type Params = RpcTypeToMessageMap[WalletAddInvokeTransactionMethod]['params'];
type Result = RpcTypeToMessageMap[WalletAddInvokeTransactionMethod]['result'];

export class WalletAddInvokeTransaction extends StarknetWalletRpc {
  async handleRequest(params: Params): Promise<Result> {
    const { calls } = params;

    const result = await this.snap.addInvoke(this.wallet.selectedAddress, calls);

    return result;
  }
}
