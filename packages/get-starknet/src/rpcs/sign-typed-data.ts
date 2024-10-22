import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { StarknetWalletRpc } from '../utils/rpc';

export type WalletSignTypedDataMethod = 'wallet_signTypedData';
type Params = RpcTypeToMessageMap[WalletSignTypedDataMethod]['params'];
type Result = RpcTypeToMessageMap[WalletSignTypedDataMethod]['result'];

export class WalletSignTypedData extends StarknetWalletRpc {
  async handleRequest(params: Params): Promise<Result> {
    return (await this.snap.signMessage({
      chainId: this.wallet.chainId,
      // To form the `TypedData` object in a more specific way,
      // preventing the `params` contains other properties that we dont need
      typedDataMessage: {
        domain: params.domain,
        types: params.types,
        message: params.message,
        primaryType: params.primaryType,
      },
      // Ensure there will be a dialog to confirm the sign operation
      enableAuthorize: true,
      address: this.wallet.selectedAddress,
    })) as unknown as Result;
  }
}
