import { boolean, object, optional, assign, type Infer } from 'superstruct';

import { AccountStateManager } from '../state/account-state-manager';
import { BaseRequestStruct, AccountStruct } from '../utils';
import { createAccountService } from '../utils/factory';
import { ChainRpcController } from './abstract/chain-rpc-controller';

export const GetCurrentAccountRequestStruct = assign(
  BaseRequestStruct,
  object({
    fromState: optional(boolean()),
  }),
);

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
   * @param params.fromState - Optional. If true, the account will only fetched from the state.
   * @returns A promise that resolves to the selected account.
   */
  protected async handleRequest(
    params: GetCurrentAccountParams,
  ): Promise<GetCurrentAccountResponse> {
    const accountService = createAccountService(this.network);

    if (params.fromState) {
      // Get the current account from the state if the flag is set.
      // This is to by pass the account discovery process, and only relied on the state data.
      // If the account is not found from the state, it will fallback to the account discover process.
      // As a trade-off, some data might not be up-to-date, such as:
      // - `deployRequired`.
      // - `upgradeRequired`.
      // - `cairoVersion`.
      // FIXME: This logic can be remove after a cache layer introduced.
      const accountMgr = new AccountStateManager();
      const currentAccountFromState = await accountMgr.getCurrentAccount({
        chainId: this.network.chainId,
      });
      if (currentAccountFromState) {
        return currentAccountFromState as unknown as GetCurrentAccountResponse;
      }
    }

    const account = await accountService.getCurrentAccount();

    return account.serialize() as unknown as GetCurrentAccountResponse;
  }
}

export const getCurrentAccount = new GetCurrentAccountRpc();
