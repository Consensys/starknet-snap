import { Box, Copyable, Heading, Icon, Text } from '@metamask/snaps-sdk/jsx';
import { type Infer, object, literal, assign } from 'superstruct';

import { alertDialog, confirmDialog } from '../ui/utils';
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
    if (
      !(await confirmDialog({
        children: (
          <Box>
            <Heading>Are you sure you want to reveal your private key?</Heading>
            <Box direction="horizontal">
              <Icon name="warning" size="md" />
              <Text>
                Confirming this action will display your private key. Ensure you
                are in a secure environment.
              </Text>
            </Box>
          </Box>
        ),
      }))
    ) {
      throw new UserRejectedOpError() as unknown as Error;
    }

    await alertDialog({
      children: (
        <Box>
          <Heading>Starknet Account Private Key</Heading>
          <Text>
            Below is your Starknet Account private key. Keep it confidential.
          </Text>
          <Copyable value={this.account.privateKey} />
        </Box>
      ),
    });

    return null;
  }
}

export const displayPrivateKey = new DisplayPrivateKeyRpc({
  showInvalidAccountAlert: false,
});
