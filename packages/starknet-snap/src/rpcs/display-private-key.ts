import { copyable, text } from '@metamask/snaps-sdk';
import { type Infer, object, literal, assign } from 'superstruct';

import {
  AccountRpcController,
  AddressStruct,
  confirmDialog,
  alertDialog,
  BaseRequestStruct,
} from '../utils';
import { UserRejectedOpError } from '../utils/exceptions';

export const DisplayPrivateKeyRequestStruct = assign(
  object({
    address: AddressStruct,
  }),
  BaseRequestStruct,
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
   * @param params.chainId - The chain id of the network.
   */
  async execute(
    params: DisplayPrivateKeyParams,
  ): Promise<DisplayPrivateKeyResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: DisplayPrivateKeyParams,
  ): Promise<DisplayPrivateKeyResponse> {
    const confirmComponents = [text('Do you want to export your private key?')];

    if (!(await confirmDialog(confirmComponents))) {
      throw new UserRejectedOpError() as unknown as Error;
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
