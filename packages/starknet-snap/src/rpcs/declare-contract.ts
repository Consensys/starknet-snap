import type { Component } from '@metamask/snaps-sdk';
import { heading, divider, row, text } from '@metamask/snaps-sdk';
import convert from 'ethereum-unit-converter';
import { constants, TransactionType } from 'starknet';
import type { Infer } from 'superstruct';
import { assign, object, optional, string } from 'superstruct';

import { FeeToken } from '../types/snapApi';
import {
  AddressStruct,
  BaseRequestStruct,
  DeclareContractPayloadStruct,
  mapDeprecatedParams,
  UniversalDetailsStruct,
  confirmDialog,
  toJson,
  AccountRpcControllerWithDeploy,
} from '../utils';
import { UserRejectedOpError } from '../utils/exceptions';
import {
  createAccount,
  declareContract as declareContractUtil,
  getEstimatedFees,
} from '../utils/starknetUtils';

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
export class DeclareContractRpc extends AccountRpcControllerWithDeploy<
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
    const { privateKey, publicKey } = this.account;

    const { includeDeploy, suggestedMaxFee, estimateResults } =
      await getEstimatedFees(
        this.network,
        address,
        privateKey,
        publicKey,
        [
          {
            type: TransactionType.DECLARE,
            payload,
          },
        ],
        details,
      );

    const accountDeployed = !includeDeploy;
    const resourceBounds = estimateResults.map(
      (result) => result.resourceBounds,
    );

    params.details = params.details ?? {};
    params.details = {
      ...params.details,
      // Aways repect the input, unless the account is not deployed
      // TODO: we may also need to increment the nonce base on the input, if the account is not deployed
      nonce: accountDeployed ? params.details?.nonce : 1,
      maxFee: suggestedMaxFee, // Override maxFee with suggestedMaxFee
      resourceBounds: resourceBounds[resourceBounds.length - 1],
    };

    if (!(await this.getDeclareContractConsensus(params, accountDeployed))) {
      throw new UserRejectedOpError() as unknown as Error;
    }

    if (!accountDeployed) {
      await createAccount({
        network: this.network,
        address,
        publicKey,
        privateKey,
        waitMode: false,
        callback: async (contractAddress: string, transactionHash: string) => {
          await this.updateAccountAsDeploy(contractAddress, transactionHash);
        },
        version: details?.version as unknown as constants.TRANSACTION_VERSION,
      });
    }

    return (await declareContractUtil(
      this.network,
      address,
      this.account.privateKey,
      payload,
      details,
    )) as DeclareContractResponse;
  }

  protected async getDeclareContractConsensus(
    params: DeclareContractParams,
    accountDeployed: boolean,
  ) {
    const { payload, details, address } = params;
    const components: Component[] = [];
    const feeToken: FeeToken =
      details?.version === constants.TRANSACTION_VERSION.V3
        ? FeeToken.STRK
        : FeeToken.ETH;

    components.push(heading('Do you want to sign this transaction?'));

    components.push(
      row(
        'Signer Address',
        text({
          value: address,
          markdown: false,
        }),
      ),
    );

    // Display a message to indicate the signed transaction will include an account deployment
    if (!accountDeployed) {
      components.push(heading(`The account will be deployed`));
      components.push(divider());
    }

    components.push(divider());

    components.push(
      row(
        `Estimated Gas Fee (${feeToken})`,
        text({
          value: convert(params.details?.maxFee, 'wei', 'ether'),
          markdown: false,
        }),
      ),
    );

    components.push(
      row(
        'Network',
        text({
          value: this.network.name,
          markdown: false,
        }),
      ),
    );

    if (payload.contract) {
      components.push(divider());
      const contractDetails =
        typeof payload.contract === 'string'
          ? payload.contract
          : toJson(payload.contract);
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

    if (payload.compiledClassHash) {
      components.push(divider());
      components.push(
        row(
          'Compiled Class Hash',
          text({
            value: payload.compiledClassHash,
            markdown: false,
          }),
        ),
      );
    }

    if (payload.classHash) {
      components.push(divider());
      components.push(
        row(
          'Class Hash',
          text({
            value: payload.classHash,
            markdown: false,
          }),
        ),
      );
    }

    if (payload.casm) {
      const casmDetails = toJson(payload.casm);
      components.push(divider());
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

    if (details?.maxFee) {
      const maxFeeInEth = convert(details.maxFee, 'wei', 'ether');
      components.push(divider());
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

    // Return the confirmation dialog with all the components
    return await confirmDialog(components);
  }
}

export const declareContract = new DeclareContractRpc({
  showInvalidAccountAlert: true,
});
