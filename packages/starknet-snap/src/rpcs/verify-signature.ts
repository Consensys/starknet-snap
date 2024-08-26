import { HexStruct } from '@metamask/utils';
import type { Infer } from 'superstruct';
import { object, assign, boolean, array } from 'superstruct';

import {
  AddressStruct,
  TypeDataStruct,
  BaseRequestStruct,
  AccountRpcController,
} from '../utils';
import { verifyTypedDataMessageSignature } from '../utils/starknetUtils';

export const VerifySignatureRequestStruct = assign(
  object({
    address: AddressStruct,
    typedDataMessage: TypeDataStruct,
    signature: array(HexStruct),
  }),
  BaseRequestStruct,
);

export const VerifySignatureResponseStruct = boolean();

export type VerifySignatureParams = Infer<typeof VerifySignatureRequestStruct>;

export type VerifySignatureResponse = Infer<
  typeof VerifySignatureResponseStruct
>;

/**
 * The RPC handler to verify a signature.
 */
export class VerifySignatureRpc extends AccountRpcController<
  VerifySignatureParams,
  VerifySignatureResponse
> {
  protected requestStruct = VerifySignatureRequestStruct;

  protected responseStruct = VerifySignatureResponseStruct;

  /**
   * Execute the verify signature request handler.
   *
   * @param params - The parameters of the request.
   * @param params.address - The address of the signer.
   * @param params.typedDataMessage - The Starknet type data message to sign.
   * @param params.signature - The signed signature in string.
   * @param params.chainId - The chain id of the network.
   * @returns the verification result in boolean.
   */
  async execute(
    params: VerifySignatureParams,
  ): Promise<VerifySignatureResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: VerifySignatureParams,
  ): Promise<VerifySignatureResponse> {
    const { typedDataMessage, address, signature } = params;

    return verifyTypedDataMessageSignature(
      address,
      this.account.privateKey,
      typedDataMessage,
      signature,
    );
  }
}

export const verifySignature = new VerifySignatureRpc({
  showInvalidAccountAlert: false,
});
