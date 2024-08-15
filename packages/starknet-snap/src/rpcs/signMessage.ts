import type { Component } from '@metamask/snaps-sdk';
import {
  heading,
  row,
  text,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { Infer } from 'superstruct';
import { array, object, string, assign } from 'superstruct';

import {
  confirmDialog,
  AddressStruct,
  toJson,
  TypeDataStruct,
  AuthorizableStruct,
  BaseRequestStruct,
  AccountRpcController,
} from '../utils';
import { signMessage as signMessageUtil } from '../utils/starknetUtils';

export const SignMessageRequestStruct = assign(
  object({
    address: AddressStruct,
    typedDataMessage: TypeDataStruct,
  }),
  AuthorizableStruct,
  BaseRequestStruct,
);

export const SignMessageResponseStruct = array(string());

export type SignMessageParams = Infer<typeof SignMessageRequestStruct>;

export type SignMessageResponse = Infer<typeof SignMessageResponseStruct>;

export class SignMessageRpc extends AccountRpcController<
  SignMessageParams,
  SignMessageResponse
> {
  protected requestStruct = SignMessageRequestStruct;

  protected responseStruct = SignMessageResponseStruct;

  protected async handleRequest(
    params: SignMessageParams,
  ): Promise<SignMessageResponse> {
    const { enableAuthorize, typedDataMessage, address } = params;
    if (
      // Get Starknet expected not to show the confirm dialog, therefore, `enableAuthorize` will set to false to bypass the confirmation
      // TODO: enableAuthorize should set default to true
      enableAuthorize &&
      !(await this.getSignMessageConsensus(typedDataMessage, address))
    ) {
      throw new UserRejectedRequestError() as unknown as Error;
    }

    return await signMessageUtil(
      this.account.privateKey,
      typedDataMessage,
      address,
    );
  }

  protected async getSignMessageConsensus(
    typedDataMessage: Infer<typeof TypeDataStruct>,
    address: string,
  ) {
    const components: Component[] = [];
    components.push(heading('Do you want to sign this message?'));
    components.push(
      row(
        'Message',
        text({
          value: toJson(typedDataMessage),
          markdown: false,
        }),
      ),
    );
    components.push(
      row(
        'Signer Address',
        text({
          value: address,
          markdown: false,
        }),
      ),
    );

    return await confirmDialog(components);
  }
}

export const signMessage = new SignMessageRpc();
