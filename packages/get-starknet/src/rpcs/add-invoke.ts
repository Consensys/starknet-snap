import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { formatCalls } from '../utils/formatter';
import { StarknetWalletRpc } from '../utils/rpc';

export type WalletAddInvokeTransactionMethod = 'wallet_addInvokeTransaction';
export type AddInvokeTransactionParams = RpcTypeToMessageMap[WalletAddInvokeTransactionMethod]['params'];
type Result = RpcTypeToMessageMap[WalletAddInvokeTransactionMethod]['result'];

export class WalletAddInvokeTransaction extends StarknetWalletRpc {
  async handleRequest(params: AddInvokeTransactionParams): Promise<Result> {
    const { calls } = params;
    return await this.snap.execute({
      address: this.wallet.selectedAddress,
      calls: formatCalls(calls),
      chainId: this.wallet.chainId,
    });
  }
}
