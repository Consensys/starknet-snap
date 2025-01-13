import { type, array, assign, boolean, object, optional, type Infer } from 'superstruct';

import { AccountStateManager } from '../state/account-state-manager';
import { BaseRequestStruct, AccountStruct, CairoVersionStruct } from '../utils';
import { ChainRpcController } from './abstract/chain-rpc-controller';

export const ListAccountsRequestStruct = BaseRequestStruct;

// Due to legacy state data, we need to relax the struct to allow for optional fields.
export const ListAccountsResponseStruct = array(
  type(
    assign(
      AccountStruct, 
      object({
        upgradeRequired: optional(boolean()),
        deployRequired: optional(boolean()),
        cairoVersion: optional(CairoVersionStruct),
      })
    ).schema
  )
);

export type ListAccountsParams = Infer<typeof ListAccountsRequestStruct>;

export type ListAccountsResponse = Infer<typeof ListAccountsResponseStruct>;

/**
 * The RPC handler to list the accounts by network.
 */
export class ListAccountsRpc extends ChainRpcController<
  ListAccountsParams,
  ListAccountsResponse
> {
  protected requestStruct = ListAccountsRequestStruct;

  protected responseStruct = ListAccountsResponseStruct;

  /**
   * Execute the list the accounts request handler.
   *
   * @param params - The parameters of the request.
   * @param params.chainId - The chain id of the network.
   * @returns A promise that resolves to an array of account.
   */
  protected async handleRequest(
    params: ListAccountsParams,
  ): Promise<ListAccountsResponse> {
    const accountService = new AccountStateManager();

    const accounts = await accountService.findAccounts({
      chainId: params.chainId,
    });

    return accounts as unknown as ListAccountsResponse;
  }
}

export const listAccounts = new ListAccountsRpc();
