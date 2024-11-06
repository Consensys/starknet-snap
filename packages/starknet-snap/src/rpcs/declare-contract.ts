import type { Component } from '@metamask/snaps-sdk';
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
  signerUI,
  networkUI,
  rowUI,
  dividerUI,
  headerUI,
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
      contractPayload: 'payload',
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
    const { payload, details, address } = params;

    if (!(await this.getDeclareContractConsensus(params))) {
      throw new UserRejectedOpError() as unknown as Error;
    }

    return (await declareContractUtil(
      this.network,
      address,
      this.account.privateKey,
      payload,
      details,
    )) as DeclareContractResponse;
  }

  protected async getDeclareContractConsensus(params: DeclareContractParams) {
    const { payload, details, address } = params;
    const components: Component[] = [];
    components.push(headerUI('Do you want to sign this transaction?'));

    components.push(
      signerUI({
        address,
        chainId: this.network.chainId,
      }),
    );

    components.push(dividerUI());
    components.push(
      networkUI({
        networkName: this.network.name,
      }),
    );

    const { compiledClassHash, classHash } = payload;

    if (compiledClassHash) {
      components.push(dividerUI());
      components.push(
        rowUI({
          label: 'Compiled Class Hash',
          value: compiledClassHash,
        }),
      );
    }

    if (classHash) {
      components.push(dividerUI());
      components.push(
        rowUI({
          label: 'Class Hash',
          value: classHash,
        }),
      );
    }

    if (details?.maxFee) {
      const maxFeeInEth = convert(details.maxFee, 'wei', 'ether');
      components.push(dividerUI());
      components.push(
        rowUI({
          label: 'Max Fee (ETH)',
          value: maxFeeInEth,
        }),
      );
    }

    // Return the confirmation dialog with all the components
    return await confirmDialog(components);
  }
}

export const declareContract = new DeclareContractRpc({
  showInvalidAccountAlert: true,
});
