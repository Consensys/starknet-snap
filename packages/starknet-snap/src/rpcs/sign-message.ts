import type { Infer } from 'superstruct';
import { array, object, string, assign } from 'superstruct';

import { renderSignMessageUI } from '../ui/utils';
import {
  AddressStruct,
  TypeDataStruct,
  AuthorizableStruct,
  BaseRequestStruct,
  AccountRpcController,
  mapDeprecatedParams,
} from '../utils';
import { UserRejectedOpError } from '../utils/exceptions';
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

/**
 * The RPC handler to sign a message.
 */
export class SignMessageRpc extends AccountRpcController<
  SignMessageParams,
  SignMessageResponse
> {
  protected requestStruct = SignMessageRequestStruct;

  protected responseStruct = SignMessageResponseStruct;

  protected async preExecute(params: SignMessageParams): Promise<void> {
    // Define mappings to ensure backward compatibility with previous versions of the API.
    // These mappings replace deprecated parameter names with the updated equivalents,
    // allowing older integrations to function without changes
    const paramMappings: Record<string, string> = {
      signerAddress: 'address',
    };

    // Apply the mappings to params
    mapDeprecatedParams(params, paramMappings);
    await super.preExecute(params);
  }

  /**
   * Execute the sign message request handler.
   * It will show a confirmation dialog to the user before signing the message.
   *
   * @param params - The parameters of the request.
   * @param params.address - The address of the signer.
   * @param params.typedDataMessage - The Starknet type data message to sign.
   * @param [params.enableAuthorize] - Optional, a flag to enable or display the confirmation dialog to the user.
   * @param params.chainId - The chain id of the network.
   * @returns the signature of the message in string array.
   */
  async execute(params: SignMessageParams): Promise<SignMessageResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: SignMessageParams,
  ): Promise<SignMessageResponse> {
    const { enableAuthorize, typedDataMessage, address } = params;
    if (
      // Get Starknet expected not to show the confirm dialog, therefore, `enableAuthorize` will set to false to bypass the confirmation
      // TODO: enableAuthorize should set default to true
      enableAuthorize &&
      !(await renderSignMessageUI({
        address,
        typedDataMessage,
        chainId: this.network.chainId,
      }))
    ) {
      throw new UserRejectedOpError() as unknown as Error;
    }

    return await signMessageUtil(
      this.account.privateKey,
      typedDataMessage,
      address,
    );
  }
}

export const signMessage = new SignMessageRpc();
