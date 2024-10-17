import type { Infer } from 'superstruct';
import { object, string, assign, array } from 'superstruct';

import {
  AddressStruct,
  BaseRequestStruct,
  AccountRpcController,
  CairoVersionStruct,
} from '../utils';
import { ACCOUNT_CLASS_HASH, CAIRO_VERSION } from '../utils/constants';
import { AccountAlreadyDeployedError } from '../utils/exceptions';
import {
  getDeployAccountCallData,
  isAccountDeployed,
} from '../utils/starknetUtils';

export const GetDeploymentDataRequestStruct = assign(
  object({
    address: AddressStruct,
  }),
  BaseRequestStruct,
);

export const GetDeploymentDataResponseStruct = object({
  address: AddressStruct,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  class_hash: string(),
  salt: string(),
  calldata: array(string()),
  version: CairoVersionStruct,
});

export type GetDeploymentDataParams = Infer<
  typeof GetDeploymentDataRequestStruct
>;

export type GetDeploymentDataResponse = Infer<
  typeof GetDeploymentDataResponseStruct
>;

/**
 * The RPC handler to get the deployment data.
 *
 */
export class GetDeploymentDataRpc extends AccountRpcController<
  GetDeploymentDataParams,
  GetDeploymentDataResponse
> {
  protected requestStruct = GetDeploymentDataRequestStruct;

  protected responseStruct = GetDeploymentDataResponseStruct;

  /**
   * Execute the get deployment data request handler.
   *
   * @param params - The parameters of the request.
   * @param params.address - The address of the account.
   * @param params.chainId - The chain id of the network.
   * @returns A promise that resolve to a `Deployment Data`.
   */
  async execute(
    params: GetDeploymentDataParams,
  ): Promise<GetDeploymentDataResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: GetDeploymentDataParams,
  ): Promise<GetDeploymentDataResponse> {
    const { address } = params;
    // Due to AccountRpcController built-in validation,
    // if the account required to force deploy (Cairo 0 with balance), it will alert with a warning dialog.
    // if the account required to force upgrade (Cairo 0 without balance), it will alert with a warning dialog.
    // hence we can safely assume that the account is Cairo 1 account.
    if (await isAccountDeployed(this.network, address)) {
      throw new AccountAlreadyDeployedError();
    }

    // We only need to take care the deployment data for Cairo 1 account.
    return {
      address: params.address,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      class_hash: ACCOUNT_CLASS_HASH,
      salt: this.account.publicKey,
      calldata: getDeployAccountCallData(this.account.publicKey, CAIRO_VERSION),
      version: CAIRO_VERSION,
    };
  }
}

export const getDeploymentData = new GetDeploymentDataRpc();
