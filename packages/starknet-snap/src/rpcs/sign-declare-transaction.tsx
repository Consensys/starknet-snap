import { Box, Heading, Section } from '@metamask/snaps-sdk/jsx';
import type { DeclareSignerDetails } from 'starknet';
import type { Infer } from 'superstruct';
import { array, object, string, assign } from 'superstruct';

import { AddressUI, JsonDataUI, NetworkUI } from '../ui/fragments';
import { confirmDialog } from '../ui/utils';
import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  DeclareSignDetailsStruct,
  mapDeprecatedParams,
} from '../utils';
import { UserRejectedOpError } from '../utils/exceptions';
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

  protected async preExecute(
    params: SignDeclareTransactionParams,
  ): Promise<void> {
    // Define mappings to ensure backward compatibility with previous versions of the API.
    // These mappings replace deprecated parameter names with the updated equivalents,
    // allowing older integrations to function without changes
    const paramMappings: Record<string, string> = {
      signerAddress: 'address',
      transaction: 'details',
    };

    // Apply the mappings to params
    mapDeprecatedParams(params, paramMappings);
    await super.preExecute(params);
  }

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
      throw new UserRejectedOpError() as unknown as Error;
    }

    return (await signDeclareTransactionUtil(
      this.account.privateKey,
      details as unknown as DeclareSignerDetails,
    )) as unknown as SignDeclareTransactionResponse;
  }

  protected async getSignDeclareTransactionConsensus(
    details: Infer<typeof DeclareSignDetailsStruct>,
  ) {
    return await confirmDialog({
      children: (
        <Box>
          <Heading>Do you want to sign this transaction?</Heading>
          <Section>
            <AddressUI
              label="Signer"
              address={details.senderAddress}
              chainId={this.network.chainId}
            />
            <NetworkUI networkName={this.network.name} />
            <JsonDataUI label={'Declare Transaction Details'} data={details} />
          </Section>
        </Box>
      ),
    });
  }
}

export const signDeclareTransaction = new SignDeclareTransactionRpc();
