import { assign, object, type Infer } from 'superstruct';

import { BaseRequestStruct, AccountStruct, AddressStruct } from '../utils';
import { createAccountService } from '../utils/factory';
import { AccountRpcController } from './abstract/account-rpc-controller';

export const SwitchAccountRequestStruct = assign(
  BaseRequestStruct,
  object({
    address: AddressStruct,
  }),
);

export const SwitchAccountResponseStruct = AccountStruct;

export type SwitchAccountParams = Infer<typeof SwitchAccountRequestStruct>;

export type SwitchAccountResponse = Infer<typeof SwitchAccountResponseStruct>;

/**
 * The RPC handler to switch a account by network.
 */
export class SwitchAccountRpc extends AccountRpcController<
  SwitchAccountParams,
  SwitchAccountResponse
> {
  protected requestStruct = SwitchAccountRequestStruct;

  protected responseStruct = SwitchAccountResponseStruct;

  /**
   * Execute the switch account request handler.
   *
   * @param params - The parameters of the request.
   * @param params.chainId - The chain id of the network.
   * @param params.address - The address of the account to switch to.
   * @returns A promise that resolves to the switched account.
   */
  protected async handleRequest(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: SwitchAccountParams,
  ): Promise<SwitchAccountResponse> {
    const accountService = createAccountService(this.network);

    await accountService.switchAccount(this.account);

    return (await this.account.serialize()) as unknown as SwitchAccountResponse;
  }

  // Switching an account does not require any verification.
  // Hence, we overrided the `verifyAccount` method to mute the error,
  // in case the account to switch for requires deploy/upgrade.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected override async verifyAccount(): Promise<void> {
    // Do not throw any error.
  }
}

export const switchAccount = new SwitchAccountRpc();
