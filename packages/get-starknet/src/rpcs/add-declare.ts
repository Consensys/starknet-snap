import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { formatDeclareTransaction } from '../utils/formatter';
import { StarknetWalletRpc } from '../utils/rpc';

export type WalletAddDeclareTransactionMethod = 'wallet_addDeclareTransaction';
type Params = RpcTypeToMessageMap[WalletAddDeclareTransactionMethod]['params'];
type Result = RpcTypeToMessageMap[WalletAddDeclareTransactionMethod]['result'];

export class WalletAddDeclareTransaction extends StarknetWalletRpc {
  async handleRequest(params: Params): Promise<Result> {
    return await this.snap.declare(this.wallet.selectedAddress, formatDeclareTransaction(params));
  }
}
