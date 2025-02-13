import { assign, object, optional, type Infer } from 'superstruct';

import { BaseRequestStruct, AccountStruct, AccountNameStruct } from '../utils';
import { createAccountService } from '../utils/factory';
import { ChainRpcController } from './abstract/chain-rpc-controller';

export const AddAccountRequestStruct = assign(
  BaseRequestStruct,
  object({
    accountName: optional(AccountNameStruct),
  }),
);

export const AddAccountResponseStruct = AccountStruct;

export type AddAccountParams = Infer<typeof AddAccountRequestStruct>;

export type AddAccountResponse = Infer<typeof AddAccountResponseStruct>;

/**
 * The RPC handler to get a active account by network.
 */
export class AddAccountRpc extends ChainRpcController<
  AddAccountParams,
  AddAccountResponse
> {
  protected requestStruct = AddAccountRequestStruct;

  protected responseStruct = AddAccountResponseStruct;

  /**
   * Execute the get active account request handler.
   *
   * @param params - The parameters of the request.
   * @param params.chainId - The chain id of the network.
   * @returns A promise that resolves to an active account.
   */
  protected async handleRequest(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: AddAccountParams,
  ): Promise<AddAccountResponse> {
    const accountService = createAccountService(this.network);

    const account = await accountService.addAccount();

    return account.serialize() as unknown as AddAccountResponse;
  }
}

export const addAccount = new AddAccountRpc();
