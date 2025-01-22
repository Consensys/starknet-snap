import { assign, enums, object, optional, type Infer } from 'superstruct';

import { BaseRequestStruct, AccountStruct, logger } from '../utils';
import { AccountDiscoveryType, createAccountService } from '../utils/factory';
import { ChainRpcController } from './abstract/chain-rpc-controller';

export const AddAccountRequestStruct = assign(
  object({
    accountDiscoveryType: optional(enums(Object.values(AccountDiscoveryType))),
  }),
  BaseRequestStruct,
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
    const accountService = createAccountService(
      this.network,
      undefined,
      params.accountDiscoveryType,
    );

    const account = await accountService.deriveAccountByIndex();

    try {
      // after derive an account, the current account will switch to the new account.
      // however if the account is failed to switch,
      // it is better not to throw an error to maintain the user experience.
      await accountService.switchAccount(this.network.chainId, account);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.warn(`Failed to switch account: ${error.message}`);
    }

    return account.serialize() as unknown as AddAccountResponse;
  }
}

export const addAccount = new AddAccountRpc();
