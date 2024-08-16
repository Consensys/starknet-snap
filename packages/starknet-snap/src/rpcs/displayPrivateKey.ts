import { copyable, text, UserRejectedRequestError } from '@metamask/snaps-sdk';
import { type Infer, object, literal, assign } from 'superstruct';

import {
  AccountRpcController,
  AddressStruct,
  confirmDialog,
  alertDialog,
  getStateData,
  AuthorizableStruct,
  BaseRequestStruct,
} from '../utils';
import { getAddressKeyDeriver } from '../utils/keyPair';
import { getKeysFromAddress } from '../utils/starknetUtils';

export const DisplayPrivateKeyRequestStruct = assign(
  object({
    address: AddressStruct,
  }),
);

export const DisplayPrivateKeyResponseStruct = literal(null);

export type DisplayPrivateKeyParams = Infer<
  typeof DisplayPrivateKeyRequestStruct
>;

export type DisplayPrivateKeyResponse = Infer<
  typeof DisplayPrivateKeyResponseStruct
>;

/**
 * The RPC handler to display a private key.
 */
export class DisplayPrivateKeyRpc extends AccountRpcController<
  DisplayPrivateKeyParams,
  DisplayPrivateKeyResponse
> {
  protected requestStruct = DisplayPrivateKeyRequestStruct;

  protected responseStruct = DisplayPrivateKeyResponseStruct;

  /**
   * Execute the display private key request handler.
   * The private key will be display via a confirmation dialog.
   *
   * @param params - The parameters of the request.
   * @param params.address - The account address.
   */
  async execute(
    params: DisplayPrivateKeyParams,
  ): Promise<DisplayPrivateKeyResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: DisplayPrivateKeyParams,
  ): Promise<DisplayPrivateKeyResponse> {

    const components = [text('Do you want to export your private key?')];

    if (!(await confirmDialog(components))) {
      throw new UserRejectedRequestError() as unknown as Error;
    }

    const alertComponents = [
      text('Starknet Account Private Key'),
      copyable(this.account.privateKey),
    ];

    await alertDialog(alertComponents);

    return null;
  }
}

export const displayPrivateKey = new DisplayPrivateKeyRpc({
  showInvalidAccountAlert: false,
});
