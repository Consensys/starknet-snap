import type { Component } from '@metamask/snaps-sdk';
import { row, text } from '@metamask/snaps-sdk';
import convert from 'ethereum-unit-converter';
import type { Infer } from 'superstruct';
import { assign, object, optional, string } from 'superstruct';

import {
  AddressStruct,
  BaseRequestStruct,
  DeclareContractPayloadStruct,
  mapDeprecatedParams,
  UniversalDetailsStruct,
  confirmDialog,
  AccountRpcController,
} from '../utils';
import { UserRejectedOpError } from '../utils/exceptions';
import { declareContract as declareContractUtil } from '../utils/starknetUtils';

// Define the DeclareContractRequestStruct
export const DeclareContractRequestStruct = assign(
  object({
    address: AddressStruct, // Sender address
    payload: DeclareContractPayloadStruct, // Contract payload structure
    details: optional(UniversalDetailsStruct), // Optional invocation details
  }),
  BaseRequestStruct, // Base request struct, could include chainId, etc.
);

export const DeclareContractResponseStruct = object({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transaction_hash: string(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  class_hash: string(),
});

export type DeclareContractParams = Infer<typeof DeclareContractRequestStruct>;
export type DeclareContractResponse = Infer<
  typeof DeclareContractResponseStruct
>;

/**
 * The RPC handler to declare a contract.
 */
export class DeclareContractRpc extends AccountRpcController<
  DeclareContractParams,
  DeclareContractResponse
> {
  protected requestStruct = DeclareContractRequestStruct;

  protected responseStruct = DeclareContractResponseStruct;

  protected async preExecute(params: DeclareContractParams): Promise<void> {
    // Define mappings to ensure backward compatibility with previous versions of the API.
    // These mappings replace deprecated parameter names with the updated equivalents,
    // allowing older integrations to function without changes
    const paramMappings: Record<string, string> = {
      senderAddress: 'address',
      invocationsDetails: 'details',
      contractPayload: 'payload'
    };

    // Apply the mappings to params
    mapDeprecatedParams(params, paramMappings);
    await super.preExecute(params);
  }

  /**
   * Execute the declare contract request handler.
   * It will show a confirmation dialog to the user before signing the contract declaration.
   *
   * @param params - The parameters of the request.
   * @param params.address - The address of the request account.
   * @param params.payload - The contract payload of the declare transaction.
   * @param [params.details] - The declare transaction details.
   * @param params.chainId - The chain id of the network.
   * @returns A Promise that resolve the `DeclareContractResponse` object.
   */
  async execute(
    params: DeclareContractParams,
  ): Promise<DeclareContractResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: DeclareContractParams,
  ): Promise<DeclareContractResponse> {
    const { contractPayload, details, address } = params;

    if (!(await this.getDeclareContractConsensus(params))) {
      throw new UserRejectedOpError() as unknown as Error;
    }

    return (await declareContractUtil(
      this.network,
      address,
      this.account.privateKey,
      contractPayload,
      details,
    )) as DeclareContractResponse;
  }

  protected async getDeclareContractConsensus(params: DeclareContractParams) {
    const { contractPayload, details, address } = params;
    const components: Component[] = [];
   components.push(heading('Do you want to sign this transaction?'))
    // Add the signer address
    components.push(
      row(
        'Signer Address',
        text({
          value: address,
          markdown: false,
        }),
      ),
    );

    // Add network information
    components.push(
      row(
        'Network',
        text({
          value: this.network.name,
          markdown: false,
        }),
      ),
    );

    // Add contract details, compiled class hash, and class hash
    if (contractPayload.contract) {
      const contractDetails =
        typeof contractPayload.contract === 'string'
          ? contractPayload.contract
          : toJson(contractPayload.contract);
      components.push(
        row(
          'Contract',
          text({
            value: contractDetails,
            markdown: false,
          }),
        ),
      );
    }

    if (contractPayload.compiledClassHash) {
      components.push(
        row(
          'Compiled Class Hash',
          text({
            value: contractPayload.compiledClassHash,
            markdown: false,
          }),
        ),
      );
    }

    if (contractPayload.classHash) {
      components.push(
        row(
          'Class Hash',
          text({
            value: contractPayload.classHash,
            markdown: false,
          }),
        ),
      );
    }

    // Add Casm details if available
    if (contractPayload.casm) {
      const casmDetails = toJson(contractPayload.casm);
      components.push(
        row(
          'Casm',
          text({
            value: casmDetails,
            markdown: false,
          }),
        ),
      );
    }

    // Add Max Fee in ETH, Nonce, and Version if they are available in details
    if (details?.maxFee) {
      const maxFeeInEth = convert(details.maxFee, 'wei', 'ether');
      components.push(
        row(
          'Max Fee (ETH)',
          text({
            value: maxFeeInEth,
            markdown: false,
          }),
        ),
      );
    }

    if (details?.nonce !== undefined) {
      components.push(
        row(
          'Nonce',
          text({
            value: details.nonce.toString(),
            markdown: false,
          }),
        ),
      );
    }

    if (details?.version !== undefined) {
      components.push(
        row(
          'Version',
          text({
            value: details.version.toString(),
            markdown: false,
          }),
        ),
      );
    }

    // Return the confirmation dialog with all the components
    return await confirmDialog(components);
  }
}

export const declareContract = new DeclareContractRpc({
  showInvalidAccountAlert: true,
});
