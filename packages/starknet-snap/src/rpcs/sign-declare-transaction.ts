import type { Component } from '@metamask/snaps-sdk';
import {
  heading,
  row,
  text,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { DeclareSignerDetails } from 'starknet';
import type { Infer } from 'superstruct';
import { array, object, string, assign } from 'superstruct';

import {
  confirmDialog,
  AddressStruct,
  toJson,
  BaseRequestStruct,
  AccountRpcController,
  DeclareSignDetailsStruct,
} from '../utils';
import { signDeclareTransaction as signDeclareTransactionUtil } from '../utils/starknetUtils';

export const SignDeclareTransactionRequestStruct = assign(
  object({
    address: AddressStruct,
    details: DeclareSignDetailsStruct,
  }),
  BaseRequestStruct,
);

export const SignDeclareTransactionResponseStruct = array(string());

export type SignDeclareTransactionParams = Infer<
  typeof SignDeclareTransactionRequestStruct
>;

export type SignDeclareTransactionResponse = Infer<
  typeof SignDeclareTransactionResponseStruct
>;

/**
 * The RPC handler to sign a declare transaction.
 */
export class SignDeclareTransactionRpc extends AccountRpcController<
  SignDeclareTransactionParams,
  SignDeclareTransactionResponse
> {
  protected requestStruct = SignDeclareTransactionRequestStruct;

  protected responseStruct = SignDeclareTransactionResponseStruct;

  /**
   * Execute the sign declare transaction request handler.
   * It will show a confirmation dialog to the user before signing the declare transaction.
   *
   * @param params - The parameters of the request.
   * @param params.address - The address of the signer.
   * @param params.details - The declare transaction details to sign.
   * @param [params.enableAuthorize] - Optional, a flag to enable or display the confirmation dialog to the user.
   * @param params.chainId - The chain id of the network.
   * @returns the signature of the message in string array.
   */
  async execute(
    params: SignDeclareTransactionParams,
  ): Promise<SignDeclareTransactionResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: SignDeclareTransactionParams,
  ): Promise<SignDeclareTransactionResponse> {
    const { details } = params;
    if (!(await this.getSignDeclareTransactionConsensus(details))) {
      throw new UserRejectedRequestError() as unknown as Error;
    }

    return (await signDeclareTransactionUtil(
      this.account.privateKey,
      details as unknown as DeclareSignerDetails,
    )) as unknown as SignDeclareTransactionResponse;
  }

  protected async getSignDeclareTransactionConsensus(
    details: Infer<typeof DeclareSignDetailsStruct>,
  ) {
    const components: Component[] = [];
    components.push(heading('Do you want to sign this transaction?'));
    components.push(
      row(
        'Network',
        text({
          value: this.network.name,
          markdown: false,
        }),
      ),
    );
    components.push(
      row(
        'Signer Address',
        text({
          value: details.senderAddress,
          markdown: false,
        }),
      ),
    );

    components.push(
      row(
        'Declare Transaction Details',
        text({
          value: toJson(details),
          markdown: false,
        }),
      ),
    );

    return await confirmDialog(components);
  }
}

export const signDeclareTransaction = new SignDeclareTransactionRpc();
