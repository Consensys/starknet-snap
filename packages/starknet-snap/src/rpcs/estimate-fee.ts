import type { Json } from '@metamask/snaps-sdk';
import type { Infer } from 'superstruct';
import { object, string, assign, boolean, optional, enums } from 'superstruct';

import { FeeTokenUnit } from '../types/snapApi';
import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  UniversalDetailsStruct,
  InvocationsStruct,
} from '../utils';
import { getEstimatedFees } from '../utils/starknetUtils';

export const EstimateFeeRequestStruct = assign(
  object({
    address: AddressStruct,
    invocations: InvocationsStruct,
    details: optional(UniversalDetailsStruct),
  }),
  BaseRequestStruct,
);

export const EstimateFeeResponseStruct = object({
  suggestedMaxFee: string(),
  overallFee: string(),
  unit: enums(Object.values(FeeTokenUnit)),
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
   * Execute the bulk estimate transaction fee request handler.
   *
   * @param params - The parameters of the request.
   * @param params.address - The account address.
   * @param params.invocations - The invocations to estimate fee. Reference: https://starknetjs.com/docs/API/namespaces/types#invocations
   * @param params.details - The universal details associated to the invocations. Reference: https://starknetjs.com/docs/API/interfaces/types.EstimateFeeDetails
   * @param params.chainId - The chain id of the network.
   * @returns A promise that resolves to a EstimateFeeResponse object.
   */
  async execute(params: EstimateFeeParams): Promise<EstimateFeeResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: EstimateFeeParams,
  ): Promise<EstimateFeeResponse> {
    const { address, invocations, details } = params;

    const estimateFeeResp = await getEstimatedFees(
      this.network,
      address,
      this.account.privateKey,
      this.account.publicKey,
      invocations,
      details,
    );

    return {
      suggestedMaxFee: estimateFeeResp.suggestedMaxFee,
      overallFee: estimateFeeResp.overallFee,
      unit: estimateFeeResp.unit,
      includeDeploy: estimateFeeResp.includeDeploy,
    };
  }
}

export const estimateFee = new EstimateFeeRpc({
  showInvalidAccountAlert: false,
});
