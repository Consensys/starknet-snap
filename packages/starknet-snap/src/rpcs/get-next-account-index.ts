import { number, object, type Infer } from 'superstruct';

import { BaseRequestStruct } from '../utils';
import { createAccountService } from '../utils/factory';
import { ChainRpcController } from './abstract/chain-rpc-controller';

export const GetNextAccountIndexRequestStruct = BaseRequestStruct;

export const GetNextAccountIndexResponseStruct = object({
  addressIndex: number(),
});

export type GetNextAccountIndexParams = Infer<
  typeof GetNextAccountIndexRequestStruct
>;

export type GetNextAccountIndexResponse = Infer<
  typeof GetNextAccountIndexResponseStruct
>;

/**
 * The RPC handler to get a active account by network.
 */
export class GetNextAccountIndexRpc extends ChainRpcController<
  GetNextAccountIndexParams,
  GetNextAccountIndexResponse
> {
  protected requestStruct = GetNextAccountIndexRequestStruct;

  protected responseStruct = GetNextAccountIndexResponseStruct;

  /**
   * Execute the get active account request handler.
   *
   * @param params - The parameters of the request.
   * @param params.chainId - The chain id of the network.
   * @returns A promise that resolves to an active account.
   */
  protected async handleRequest(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: GetNextAccountIndexParams,
  ): Promise<GetNextAccountIndexResponse> {
    const accountService = createAccountService(this.network);
    const addressIndex = await accountService.getNextIndex();

    return { addressIndex } as GetNextAccountIndexResponse;
  }
}

export const getNextAccountIndex = new GetNextAccountIndexRpc();
