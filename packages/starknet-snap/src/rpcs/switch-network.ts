import type { Component } from '@metamask/snaps-sdk';
import {
  divider,
  heading,
  row,
  text,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { Infer } from 'superstruct';
import { assign, boolean } from 'superstruct';

import {
  confirmDialog,
  AuthorizableStruct,
  BaseRequestStruct,
  RpcController,
} from '../utils';
import { NetworkStateManager } from '../state/network-state-manager';

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

    return await networkStateMgr.withTransaction<boolean>(async (state) => {
      const currentNetwork = await networkStateMgr.getCurrentNetwork(state);

      // Return early if the current network is the same as the requested network
      if (currentNetwork.chainId === chainId) {
        return true;
      }

      let network = await networkStateMgr.getNetwork({
        chainId
      }, state)
  
      // if the network is not in the list of networks that we support, we throw an error
      if (!network) {
        throw new Error(`Network not supported`);
      }
      
      if (
        // Get Starknet expected not to show the confirm dialog, therefore, `enableAuthorize` will set to false to bypass the confirmation
        // TODO: enableAuthorize should set default to true
        enableAuthorize &&
        !(await this.getSwitchNetworkConsensus(network.name, network.chainId))
      ) {
        throw new UserRejectedRequestError() as unknown as Error;
      }

      await networkStateMgr.setCurrentNetwork(network);
      
      return true
    })
  }

  protected async getSwitchNetworkConsensus(
    networkName: string,
    networkChainId: string,
  ) {
    const components: Component[] = [];
    components.push(heading('Do you want to switch to this network?'));
    components.push(row(
      'Chain Name',
      text({
        value: networkName,
        markdown: false,
      }),
    ));
    components.push(divider())
    components.push(row(
      'Chain ID',
      text({
        value: networkChainId,
        markdown: false,
      }),
    ));

    return await confirmDialog(components);
  }
}

export const switchNetwork = new SwitchNetworkRpc();
