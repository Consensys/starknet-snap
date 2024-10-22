import type { constants } from 'starknet';
import type { Infer } from 'superstruct';
import { literal, string, object } from 'superstruct';

import { NetworkStateManager } from '../state/network-state-manager';
import { RpcController, ChainIdStruct } from '../utils';

export const GetCurrentNetworkRequestStruct = literal(null);

export const GetCurrentNetworkResponseStruct = object({
  name: string(),
  chainId: ChainIdStruct,
});

export type GetCurrentNetworkParams = Infer<
  typeof GetCurrentNetworkRequestStruct
>;

export type GetCurrentNetworkResponse = Infer<
  typeof GetCurrentNetworkResponseStruct
>;

/**
 * The RPC handler to get the current network.
 */
export class GetCurrentNetworkRpc extends RpcController<
  GetCurrentNetworkParams,
  GetCurrentNetworkResponse
> {
  protected requestStruct = GetCurrentNetworkRequestStruct;

  protected responseStruct = GetCurrentNetworkResponseStruct;

  /**
   * Execute the get the current network.
   *
   * @param _
   * @returns A promise that resolve to the current network.
   */
  async execute(
    _: GetCurrentNetworkParams,
  ): Promise<GetCurrentNetworkResponse> {
    return super.execute(_);
  }

  protected async handleRequest(
    _: GetCurrentNetworkParams,
  ): Promise<GetCurrentNetworkResponse> {
    const networkStateMgr = new NetworkStateManager();
    const network = await networkStateMgr.getCurrentNetwork();
    return {
      name: network.name,
      chainId: network.chainId as unknown as constants.StarknetChainId,
    };
  }
}

export const getCurrentNetwork = new GetCurrentNetworkRpc();
