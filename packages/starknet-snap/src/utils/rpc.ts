import type { getBIP44ChangePathString } from '@metamask/key-tree/dist/types/utils';
import type { Json } from '@metamask/snaps-sdk';
import { InvalidParamsError, SnapError } from '@metamask/snaps-sdk';
import type { Struct } from 'superstruct';
import { assert } from 'superstruct';

import type { SnapState } from '../types/snapState';
import { logger } from './logger';
import { getBip44Deriver, getStateData } from './snap';
import { getNetworkFromChainId } from './snapUtils';
import { getKeysFromAddress } from './starknetUtils';

/**
 * Validates that the request parameters conform to the expected structure defined by the provided struct.
 *
 * @template Params - The expected structure of the request parameters.
 * @param requestParams - The request parameters to validate.
 * @param struct - The expected structure of the request parameters.
 * @throws {InvalidParamsError} If the request parameters do not conform to the expected structure.
 */
export function validateRequest<Params>(requestParams: Params, struct: Struct) {
  try {
    assert(requestParams, struct);
  } catch (error) {
    throw new InvalidParamsError(error.message) as unknown as Error;
  }
}

/**
 * Validates that the response conforms to the expected structure defined by the provided struct.
 *
 * @template Params - The expected structure of the response.
 * @param response - The response to validate.
 * @param struct - The expected structure of the response.
 * @throws {SnapError} If the response does not conform to the expected structure.
 */
export function validateResponse<Params>(response: Params, struct: Struct) {
  try {
    assert(response, struct);
  } catch (error) {
    throw new SnapError('Invalid Response') as unknown as Error;
  }
}

export abstract class RpcController<
  Request extends Json,
  Response extends Json,
> {
  /**
   * Superstruct for the request.
   */
  abstract requestStruct: Struct;

  /**
   * Superstruct for the response.
   */
  abstract responseStruct: Struct;

  abstract handleRequest(params: Request): Promise<Response>;

  protected async preExecute(params: Request): Promise<void> {
    logger.info(`[SnapRpc.preExecute] Request: ${JSON.stringify(params)}`);
    validateRequest(params, this.requestStruct);
  }

  protected async postExecute(response: Response): Promise<void> {
    logger.info(`[SnapRpc.postExecute] Response: ${JSON.stringify(response)}`);
    validateResponse(response, this.responseStruct);
  }

  /**
   * A method to execute the rpc method.
   *
   * @param params - An struct contains the require parameter for the request.
   * @returns A promise that resolves to an json.
   */
  async execute(params: Request): Promise<Response> {
    await this.preExecute(params);
    const resp = await this.handleRequest(params);
    await this.postExecute(resp);
    return resp;
  }
}


// TODO: the Type should be moved to a common place
export type AccountRpcParams = Json & {
  chainId: string;
  address: string;
};

// TODO: the Account object should move into a account manager for generate account
export type Account = {
  privateKey: string;
  publicKey: string;
  addressIndex: number;
  // This is the derivation path of the address, it is used in `getNextAddressIndex` to find the account in state where matching the same derivation path
  derivationPath: ReturnType<typeof getBIP44ChangePathString>;
};

export abstract class AccountRpcController<
  Request extends AccountRpcParams,
  Response extends Json,
> extends RpcController<Request, Response> {
  account: Account;

  protected async preExecute(params: Request): Promise<void> {
    await super.preExecute(params);

    const deriver = await getBip44Deriver();
    // TODO: Instead of having the get on the state directly, we should should implement state management to consolidate the state fetching
    const state = await getStateData<SnapState>();

    // TODO: getNetworkFromChainId from state is still needed, due to it is supporting in get-starknet at this moment
    const network = getNetworkFromChainId(state, params.chainId);

    // TODO: This method should be refactored to get the account from an account manager
    this.account = await getKeysFromAddress(
      deriver,
      network,
      state,
      params.address,
    );
  }
}
