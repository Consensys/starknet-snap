import type { RpcTypeToMessageMap } from 'get-starknet-core';
import type { Call } from 'starknet';

import { StarknetWalletRpc } from '../utils/rpc';

export type WalletAddInvokeTransactionMethod = 'wallet_addInvokeTransaction';
type Params = RpcTypeToMessageMap[WalletAddInvokeTransactionMethod]['params'];
type Result = RpcTypeToMessageMap[WalletAddInvokeTransactionMethod]['result'];

export class WalletAddInvokeTransaction extends StarknetWalletRpc {
  async handleRequest(params: Params): Promise<Result> {
    const { calls } = params;

    // Todo remove the cast when merging to main
    const result = await this.snap.execute(this.wallet.selectedAddress, calls as unknown as Call[]);

    return result;
  }
}
