import type { Infer } from 'superstruct';
import { assign, object, string } from 'superstruct';

import { AccountStateManager } from '../state/account-state-manager';
import { AccountStruct, AddressStruct, BaseRequestStruct } from '../utils';
import { AccountRpcController } from './abstract/account-rpc-controller';

export const SetAccountNameRequestStruct = assign(
  BaseRequestStruct,
  object({
    address: AddressStruct,
    accountName: string(),
  }),
);

export const SetAccountNameResponseStruct = AccountStruct;

export type SetAccountNameParams = Infer<typeof SetAccountNameRequestStruct>;

export type SetAccountNameResponse = Infer<typeof SetAccountNameResponseStruct>;

/**
 * The RPC handler to toggle the account visibility.
 */
export class SetAccountNameRpc extends AccountRpcController<
  SetAccountNameParams,
  SetAccountNameResponse
> {
  protected requestStruct = SetAccountNameRequestStruct;

  protected responseStruct = SetAccountNameResponseStruct;

  /**
   * Execute the toggle account visibility request handler.
   *
   * @param params - The parameters of the request.
   * @param params.chainId - The chain id of the network to switch.
   * @param params.address - The address of the account to change the visibility.
   * @param params.visibility - The visibility status of the account.
   * @returns A promise that resolves to the current account.
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
