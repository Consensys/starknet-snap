import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { formatDeclareTransaction } from '../utils/formatter';
import { StarknetWalletRpc } from '../utils/rpc';

export type WalletAddDeclareTransactionMethod = 'wallet_addDeclareTransaction';
export type AddDeclareParams = RpcTypeToMessageMap[WalletAddDeclareTransactionMethod]['params'];
type Result = RpcTypeToMessageMap[WalletAddDeclareTransactionMethod]['result'];

export class WalletAddDeclareTransaction extends StarknetWalletRpc {
  async handleRequest(params: AddDeclareParams): Promise<Result> {
    return await this.snap.declare({
      senderAddress: this.wallet.selectedAddress,
      contractPayload: formatDeclareTransaction(params),
      chainId: this.wallet.chainId,
    });
  }
}
