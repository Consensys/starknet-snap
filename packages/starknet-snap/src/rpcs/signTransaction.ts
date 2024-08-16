import type { Component } from '@metamask/snaps-sdk';
import { heading, UserRejectedRequestError } from '@metamask/snaps-sdk';
import type { InvocationsSignerDetails } from 'starknet';
import type { Infer } from 'superstruct';
import { array, object, string, assign, any } from 'superstruct';

import {
  confirmDialog,
  AddressStruct,
  AuthorizableStruct,
  BaseRequestStruct,
  AccountRpcController,
} from '../utils';
import { getSignTxnTxt } from '../utils/snapUtils';
import { signTransactions } from '../utils/starknetUtils';

export const CallStruct = object({
  contractAddress: string(),
  calldata: array(any()), // Adjust this as needed for `RawArgs` or `Calldata`
  entrypoint: string(),
});

export const SignTransactionRequestStruct = assign(
  object({
    address: AddressStruct,
    transactions: array(CallStruct),
    transactionsDetail: any(),
  }),
  AuthorizableStruct,
  BaseRequestStruct,
);

export const SignTransactionResponseStruct = array(string());

export type SignTransactionParams = Infer<typeof SignTransactionRequestStruct>;

export type SignTransactionResponse = Infer<
  typeof SignTransactionResponseStruct
>;

/**
 * The RPC handler to sign a transaction.
 */
export class SignTransactionRpc extends AccountRpcController<
  SignTransactionParams,
  SignTransactionResponse
> {
  protected requestStruct = SignTransactionRequestStruct;

  protected responseStruct = SignTransactionResponseStruct;

  /**
   * Execute the sign transaction request handler.
   * It will show a confirmation dialog to the user before signing the transaction.
   *
   * @param params - The parameters of the request.
   * @returns the signature of the transaction in string array.
   */
  async execute(
    params: SignTransactionParams,
  ): Promise<SignTransactionResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: SignTransactionParams,
  ): Promise<SignTransactionResponse> {
    const { enableAuthorize, transactions, address } = params;

    const snapComponents = getSignTxnTxt(address, this.network, transactions);

    if (
      // Get Starknet expected not to show the confirm dialog, therefore, `enableAuthorize` will set to false to bypass the confirmation
      // TODO: enableAuthorize should set default to true
      enableAuthorize &&
      !(await this.getSignTransactionConsensus(snapComponents))
    ) {
      throw new UserRejectedRequestError() as unknown as Error;
    }

    return (await signTransactions(
      this.account.privateKey,
      transactions,
      params.transactionsDetail as InvocationsSignerDetails,
    )) as SignTransactionResponse;
  }

  protected async getSignTransactionConsensus(snapComponents: Component[]) {
    return await confirmDialog([
      heading('Do you want to sign this transaction?'),
      ...snapComponents,
    ]);
  }
}

export const signTransaction = new SignTransactionRpc();
