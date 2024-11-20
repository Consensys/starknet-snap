import type { Infer } from 'superstruct';
import { assign, boolean } from 'superstruct';

import { NetworkStateManager } from '../state/network-state-manager';
import { renderSwitchNetworkUI } from '../ui/utils';
import { AuthorizableStruct, BaseRequestStruct, RpcController } from '../utils';
import { InvalidNetworkError, UserRejectedOpError } from '../utils/exceptions';

export const SwitchNetworkRequestStruct = assign(
  AuthorizableStruct,
  BaseRequestStruct,
);

export const SwitchNetworkResponseStruct = boolean();

export type SwitchNetworkParams = Infer<typeof SwitchNetworkRequestStruct>;

export type SwitchNetworkResponse = Infer<typeof SwitchNetworkResponseStruct>;

/**
 * The RPC handler to switch the network.
 */
export class SwitchNetworkRpc extends RpcController<
  SwitchNetworkParams,
  SwitchNetworkResponse
> {
  protected requestStruct = SwitchNetworkRequestStruct;

  protected responseStruct = SwitchNetworkResponseStruct;

  /**
   * Execute the switching network request handler.
   * It switch to a supported network based on the chain id.
   * It will show a confirmation dialog to the user before switching a network.
   *
   * @param params - The parameters of the request.
   * @param [params.enableAuthorize] - Optional, a flag to enable or display the confirmation dialog to the user.
   * @param params.chainId - The chain id of the network to switch.
   * @returns the response of the switching a network in boolean.
   * @throws {UserRejectedRequestError} If the user rejects the request.
   * @throws {Error} If the network with the chain id is not supported.
   */
  async execute(params: SwitchNetworkParams): Promise<SwitchNetworkResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: SwitchNetworkParams,
  ): Promise<SwitchNetworkResponse> {
    const { enableAuthorize, chainId } = params;
    const networkStateMgr = new NetworkStateManager();

    // Using transactional state interaction to ensure that the state is updated atomically
    // To avoid a use case while 2 requests are trying to update/read the state at the same time
    return await networkStateMgr.withTransaction<boolean>(async (state) => {
      const currentNetwork = await networkStateMgr.getCurrentNetwork(state);

      // Return early if the current network is the same as the requested network
      if (currentNetwork.chainId === chainId) {
        return true;
      }

      const network = await networkStateMgr.getNetwork(
        {
          chainId,
        },
        state,
      );

      // if the network is not in the list of networks that we support, we throw an error
      if (!network) {
        throw new InvalidNetworkError() as unknown as Error;
      }

      if (
        // Get Starknet expected show the confirm dialog, while the companion doesnt needed,
        // therefore, `enableAuthorize` is to enable/disable the confirmation
        enableAuthorize &&
        !(await renderSwitchNetworkUI({
          name: network.name,
          chainId: network.chainId,
        }))
      ) {
        throw new UserRejectedOpError() as unknown as Error;
      }

      await networkStateMgr.setCurrentNetwork(network);

      return true;
    });
  }
}

export const switchNetwork = new SwitchNetworkRpc();
