import type { Infer } from 'superstruct';
import { assign, boolean, object } from 'superstruct';

import { AccountStateManager } from '../state/account-state-manager';
import { AccountStruct, AddressStruct, BaseRequestStruct } from '../utils';
import { AccountRpcController } from './abstract/account-rpc-controller';

export const ToggleAccounrtVisibilityRequestStruct = assign(
  BaseRequestStruct,
  object({
    address: AddressStruct,
    visibility: boolean(),
  }),
);

export const ToggleAccounrtVisibilityResponseStruct = AccountStruct;

export type ToggleAccountVisibilityParams = Infer<
  typeof ToggleAccounrtVisibilityRequestStruct
>;

export type ToggleAccounrtVisibilityResponse = Infer<
  typeof ToggleAccounrtVisibilityResponseStruct
>;

/**
 * The RPC handler to toggle the account visibility.
 */
export class ToggleAccounrtVisibilityRpc extends AccountRpcController<
  ToggleAccountVisibilityParams,
  ToggleAccounrtVisibilityResponse
> {
  protected requestStruct = ToggleAccounrtVisibilityRequestStruct;

  protected responseStruct = ToggleAccounrtVisibilityResponseStruct;

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
    params: ToggleAccountVisibilityParams,
  ): Promise<ToggleAccounrtVisibilityResponse> {
    const { visibility } = params;

    const accMgt = new AccountStateManager();

    const { address, chainId } = this.account;

    const accountJsonData = await accMgt.withTransaction(async (state) => {
      await accMgt.toggleAccountVisibility({
        address,
        chainId,
        visibility,
      });
      return await accMgt.getCurrentAccount({ chainId }, state);
    });

    return accountJsonData as ToggleAccounrtVisibilityResponse;
  }
}

export const toggleAccountVisibility = new ToggleAccounrtVisibilityRpc();
