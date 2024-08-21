import type { Infer } from 'superstruct';
import { object, string, assign, boolean } from 'superstruct';

import {
  AddressStruct,
  AuthorizableStruct,
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
    transactionVersion: string(),
  }),
  AuthorizableStruct,
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
   * @param params.transactions - The list of transactions to be signed. Reference: https://www.starknetjs.com/docs/API/namespaces/types#call
   * @param params.transactionsDetail - The InvocationsSignerDetails of the transactions to be signed. Reference: https://www.starknetjs.com/docs/API/namespaces/types#invocationssignerdetails
   * @param [params.enableAuthorize] - Optional, a flag to enable or bypass the confirmation dialog.
   * @returns the signature of the transaction in a string array.
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

    const estimateFeeResp = await getEstimatedFees(
      this.network,
      address,
      this.account.privateKey,
      this.account.publicKey,
      contractAddress,
      contractFuncName,
      contractCallData.split(',').map((ele) => ele.trim()),
      transactionVersion as '0x2' | '0x3',
      !accountDeployed,
    );

    logger.log(`estimateFee: Response: ${toJson(estimateFeeResp)}`);

    return estimateFeeResp;
  }
}

export const estimateFee = new EstimateFeeRpc({
  showInvalidAccountAlert: false,
  checkDeploy: false,
  checkUpgrade: true,
});
