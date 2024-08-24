import type { Json } from '@metamask/snaps-sdk';
import type { Invocations } from 'starknet';
import { TransactionType } from 'starknet';
import type { Infer } from 'superstruct';
import {
  object,
  string,
  assign,
  boolean,
  enums,
  optional,
  array,
  any,
  union,
  number,
} from 'superstruct';

import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  createStructWithAdditionalProperties,
} from '../utils';
import { TRANSACTION_VERSION } from '../utils/constants';
import { getEstimatedFees, isAccountDeployed } from '../utils/starknetUtils';

// Define the types you expect for additional properties
const additionalPropertyTypes = union([string(), number(), any()]);

const DeclarePayloadStruct = createStructWithAdditionalProperties(
  object({
    contract: union([any(), string()]),
    classHash: optional(string()),
    casm: optional(any()),
    compiledClassHash: optional(string()),
  }),
  additionalPropertyTypes,
);

const InvokePayloadStruct = createStructWithAdditionalProperties(
  object({
    contractAddress: string(),
    calldata: optional(any()), // Assuming RawArgs or Calldata can be represented as any or string
    entrypoint: optional(string()), // Making entrypoint optional as it was mentioned in the example
  }),
  additionalPropertyTypes,
);

const DeclareTransactionStruct = object({
  type: enums([TransactionType.DECLARE]),
  payload: optional(DeclarePayloadStruct),
});

const DeployTransactionStruct = object({
  type: enums([TransactionType.DEPLOY]),
  payload: optional(any()),
});

const DeployAccountTransactionStruct = object({
  type: enums([TransactionType.DEPLOY_ACCOUNT]),
  payload: optional(any()),
});

const InvokeTransactionStruct = object({
  type: enums([TransactionType.INVOKE]),
  payload: optional(InvokePayloadStruct),
});

const InvocationStruct = union([
  DeclareTransactionStruct,
  DeployTransactionStruct,
  DeployAccountTransactionStruct,
  InvokeTransactionStruct,
]);

const UniversalDetailsStruct = object({
  nonce: optional(any()),
  blockIdentifier: optional(any()),
  maxFee: optional(any()),
  tip: optional(any()),
  paymasterData: optional(array(any())),
  accountDeploymentData: optional(array(any())),
  nonceDataAvailabilityMode: optional(any()),
  feeDataAvailabilityMode: optional(any()),
  version: optional(enums(['0x2', '0x3'])),
  resourceBounds: optional(any()),
  skipValidate: optional(boolean()),
});

export const EstimateFeeRequestStruct = assign(
  object({
    address: AddressStruct,
    invocations: array(InvocationStruct),
    details: optional(UniversalDetailsStruct),
  }),
  BaseRequestStruct,
);

export const EstimateFeeResponseStruct = object({
  suggestedMaxFee: string(),
  overallFee: string(),
  unit: string(),
  includeDeploy: boolean(),
});

export type EstimateFeeParams = Infer<typeof EstimateFeeRequestStruct> & Json;

export type EstimateFeeResponse = Infer<typeof EstimateFeeResponseStruct>;

/**
 * The RPC handler to estimate fee of a transaction.
 */
export class EstimateFeeRpc extends AccountRpcController<
  EstimateFeeParams,
  EstimateFeeResponse
> {
  protected requestStruct = EstimateFeeRequestStruct;

  protected responseStruct = EstimateFeeResponseStruct;

  /**
   * Execute the estimate transaction fee request handler.
   *
   * @param params - The parameters of the request.
   * @param params.address - The address of the signer.
   * @param params.invocations - The invocations to estimate fee.
   * @param params.details - The detail associated to the call.
   * @returns The estimated transaction fee as an `EstimateFeeResponse`.
   */
  async execute(params: EstimateFeeParams): Promise<EstimateFeeResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: EstimateFeeParams,
  ): Promise<EstimateFeeResponse> {
    const { address, invocations, details } = params;

    const accountDeployed = await isAccountDeployed(this.network, address);

    const estimateFeeResp = await getEstimatedFees(
      this.network,
      address,
      this.account.privateKey,
      this.account.publicKey,
      invocations as unknown as Invocations,
      details?.version ?? TRANSACTION_VERSION,
      !accountDeployed,
    );

    return estimateFeeResp;
  }
}

export const estimateFee = new EstimateFeeRpc({
  showInvalidAccountAlert: false,
});
