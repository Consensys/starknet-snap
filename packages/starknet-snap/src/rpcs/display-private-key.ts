import { type Infer, object, literal, assign } from 'superstruct';

import {
  renderDisplayPrivateKeyAlertUI,
  renderDisplayPrivateKeyConfirmUI,
} from '../ui/utils';
import {
  AccountRpcController,
  AddressStruct,
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
    if (!(await renderDisplayPrivateKeyConfirmUI())) {
      throw new UserRejectedOpError() as unknown as Error;
    }

    await renderDisplayPrivateKeyAlertUI(this.account.privateKey);
    return null;
  }
}

export const displayPrivateKey = new DisplayPrivateKeyRpc({
  showInvalidAccountAlert: false,
});
