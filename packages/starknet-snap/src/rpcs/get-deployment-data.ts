import type { Infer } from 'superstruct';
import { object, string, assign, array } from 'superstruct';

import { AddressStruct, BaseRequestStruct, CairoVersionStruct } from '../utils';
import { AccountAlreadyDeployedError } from '../utils/exceptions';
import { AccountRpcController } from './abstract/account-rpc-controller';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: GetDeploymentDataParams,
  ): Promise<GetDeploymentDataResponse> {
    const { accountContract } = this.account;
    const {
      deployPayload: {
        contractAddress: address,
        classHash,
        addressSalt: salt,
        constructorCalldata: calldata,
      },
      cairoVerion,
    } = accountContract;

    // Due to AccountRpcController built-in validation,
    // if the account required to:
    // - deploy (Cairo 0 with balance)
    // - upgrade (Cairo 0 without balance)
    // it will throw an error
    // hence we can safely assume that the account is Cairo 1 account.
    // therefore if the account is already deployed, we should throw an error.
    if (await accountContract.isDeployed()) {
      throw new AccountAlreadyDeployedError();
    }

    // We only need to take care the deployment data for Cairo 1 account.
    return {
      address,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      class_hash: classHash,
      salt,
      calldata,
      version: cairoVerion.toString(10),
    } as GetDeploymentDataResponse;
  }
}

export const getDeploymentData = new GetDeploymentDataRpc();
