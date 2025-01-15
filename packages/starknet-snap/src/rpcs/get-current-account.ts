import { type Infer } from 'superstruct';

import { BaseRequestStruct, AccountStruct } from '../utils';
import { createAccountService } from '../utils/factory';
import { ChainRpcController } from './abstract/chain-rpc-controller';

export const GetCurrentAccountRequestStruct = BaseRequestStruct;

export const GetCurrentAccountResponseStruct = AccountStruct;

export type GetCurrentAccountParams = Infer<
  typeof GetCurrentAccountRequestStruct
>;

export type GetCurrentAccountResponse = Infer<
  typeof GetCurrentAccountResponseStruct
>;

/**
 * The RPC handler to get the current account by network.
 */
export class GetCurrentAccountRpc extends ChainRpcController<
  GetCurrentAccountParams,
  GetCurrentAccountResponse
> {
  protected requestStruct = GetCurrentAccountRequestStruct;

  protected responseStruct = GetCurrentAccountResponseStruct;

  /**
   * Execute the get current account request handler.
   *
   * @param params - The parameters of the request.
   * @param params.chainId - The chain id of the network.
   * @returns A promise that resolves to the selected account.
   */
  protected async handleRequest(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: GetCurrentAccountParams,
  ): Promise<GetCurrentAccountResponse> {
    const accountService = createAccountService(this.network);

    const account = await accountService.getCurrentAccount();

    return account.serialize() as unknown as GetCurrentAccountResponse;
  }
}

export const getCurrentAccount = new GetCurrentAccountRpc();
