import type { Invocations } from 'starknet';
import { TransactionType } from 'starknet';
import type { Infer } from 'superstruct';
import { object, string, assign, boolean, enums } from 'superstruct';

import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  toJson,
  logger,
} from '../utils';
import { getEstimatedFees, isAccountDeployed } from '../utils/starknetUtils';

export const EstimateFeeRequestStruct = assign(
  object({
    address: AddressStruct,
    contractAddress: AddressStruct,
    contractFuncName: string(),
    contractCallData: string(),
    transactionVersion: enums(['0x2', '0x3']),
  }),
  BaseRequestStruct,
);

export const EstimateFeeResponseStruct = object({
  suggestedMaxFee: string(),
  overallFee: string(),
  unit: string(),
  includeDeploy: boolean(),
});

export type EstimateFeeParams = Infer<typeof EstimateFeeRequestStruct>;

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
   * @param params.contractAddress - The address of the contract to interact with.
   * @param params.contractFuncName - The name of the contract function to invoke.
   * @param params.contractCallData - The calldata to be passed to the contract function, as a comma-separated string.
   * @param params.transactionVersion - The version of the transaction, must be '0x2' or '0x3'.
   * @returns The estimated transaction fee as an `EstimateFeeResponse`.
   */
  async execute(params: EstimateFeeParams): Promise<EstimateFeeResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: EstimateFeeParams,
  ): Promise<EstimateFeeResponse> {
    const {
      address,
      contractAddress,
      contractFuncName,
      contractCallData,
      transactionVersion,
    } = params;

    const accountDeployed = await isAccountDeployed(this.network, address);

    logger.log(
      `estimateFee: Transaction Invocation params: ${toJson({
        contractAddress,
        contractFuncName,
        contractCallData: contractCallData.split(',').map((ele) => ele.trim()),
      })}`,
    );

    const invocations: Invocations = [
      {
        type: TransactionType.INVOKE,
        payload: {
          contractAddress,
          entrypoint: contractFuncName,
          calldata: contractCallData.split(',').map((ele) => ele.trim()),
        },
      },
    ];

    const estimateFeeResp = await getEstimatedFees(
      this.network,
      address,
      this.account.privateKey,
      this.account.publicKey,
      invocations,
      transactionVersion,
      !accountDeployed,
    );

    return estimateFeeResp;
  }
}

export const estimateFee = new EstimateFeeRpc({
  showInvalidAccountAlert: false,
});
