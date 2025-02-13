import type { Infer } from 'superstruct';
import { assign, object } from 'superstruct';

import { AccountStateManager } from '../state/account-state-manager';
import {
  AccountNameStruct,
  AccountStruct,
  AddressStruct,
  BaseRequestStruct,
} from '../utils';
import { AccountRpcController } from './abstract/account-rpc-controller';

export const SetAccountNameRequestStruct = assign(
  BaseRequestStruct,
  object({
    address: AddressStruct,
    accountName: AccountNameStruct,
  }),
);

export const SetAccountNameResponseStruct = AccountStruct;

export type SetAccountNameParams = Infer<typeof SetAccountNameRequestStruct>;

export type SetAccountNameResponse = Infer<typeof SetAccountNameResponseStruct>;

/**
 * The RPC handler to set the account name.
 */
export class SetAccountNameRpc extends AccountRpcController<
  SetAccountNameParams,
  SetAccountNameResponse
> {
  protected requestStruct = SetAccountNameRequestStruct;

  protected responseStruct = SetAccountNameResponseStruct;

  /**
   * Executes the request to update an account's name.
   *
   * @param params - The parameters of the request.
   * @param params.chainId - The chain ID of the network where the account resides.
   * @param params.address - The address of the account whose name will be updated.
   * @param params.accountName - The new name to assign to the account.
   * @returns A promise that resolves to the updated account details.
   */
  protected async handleRequest(
    params: SetAccountNameParams,
  ): Promise<SetAccountNameResponse> {
    const { accountName } = params;

    const accMgt = new AccountStateManager();

    const { address, chainId } = this.account;

    const accountJsonData = await accMgt.withTransaction(async (state) => {
      await accMgt.setAccountName({
        address,
        chainId,
        accountName,
      });
      return await accMgt.getCurrentAccount({ chainId }, state);
    });

    return accountJsonData as SetAccountNameResponse;
  }
}

export const setAccountName = new SetAccountNameRpc();
