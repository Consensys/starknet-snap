import type { Json } from '@metamask/snaps-sdk';
import type { Invocations } from 'starknet';
import type { Infer } from 'superstruct';
import { object, string, assign, boolean, optional, array } from 'superstruct';

import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  InvocationStruct,
  UniversalDetailsStruct,
} from '../utils';
import { TRANSACTION_VERSION } from '../utils/constants';
import { getEstimatedFees } from '../utils/starknetUtils';

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

    const estimateFeeResp = await getEstimatedFees(
      this.network,
      address,
      this.account.privateKey,
      this.account.publicKey,
      invocations as unknown as Invocations,
      details?.version ?? TRANSACTION_VERSION,
    );

    return estimateFeeResp;
  }
}

export const estimateFee = new EstimateFeeRpc({
  showInvalidAccountAlert: false,
});
