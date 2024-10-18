import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { formatCalls } from '../utils/formatter';
import { StarknetWalletRpc } from '../utils/rpc';

export type WalletAddInvokeTransactionMethod = 'wallet_addInvokeTransaction';
type Params = RpcTypeToMessageMap[WalletAddInvokeTransactionMethod]['params'];
type Result = RpcTypeToMessageMap[WalletAddInvokeTransactionMethod]['result'];

export class WalletAddInvokeTransaction extends StarknetWalletRpc {
  async handleRequest(params: Params): Promise<Result> {
    const { calls } = params;
    return await this.snap.execute(this.wallet.selectedAddress, formatCalls(calls));
  }
}
