import type { Infer } from 'superstruct';
import { assign, object } from 'superstruct';

import { NetworkStateManager } from '../state/network-state-manager';
import { AddressStruct, BaseRequestStruct, StarkNameStruct } from '../utils';
import { getAddrFromStarkNameUtil } from '../utils/starknetUtils';
import { ChainRpcController } from './abstract/chain-rpc-controller';

export const GetAddrFromStarkNameRequestStruct = assign(
  object({
    starkName: StarkNameStruct,
  }),
  BaseRequestStruct,
);

export const GetAddrFromStarkNameResponseStruct = AddressStruct;

export type GetAddrFromStarkNameParams = Infer<
  typeof GetAddrFromStarkNameRequestStruct
>;

export type GetAddrFromStarkNameResponse = Infer<
  typeof GetAddrFromStarkNameResponseStruct
>;

/**
 * The RPC handler to get a StarkName by a Starknet address.
 */
export class GetAddrFromStarkNameRpc extends ChainRpcController<
  GetAddrFromStarkNameParams,
  GetAddrFromStarkNameResponse
> {
  protected requestStruct = GetAddrFromStarkNameRequestStruct;

  protected responseStruct = GetAddrFromStarkNameResponseStruct;

  protected readonly networkStateMgr: NetworkStateManager;

  constructor() {
    super();
    this.networkStateMgr = new NetworkStateManager();
  }

  /**
   * Execute the get address from stark name request handler.
   *
   * @param params - The parameters of the request.
   * @param params.starkName - The stark name of the user.
   * @param params.chainId - The chain id of the network.
   * @returns A promise that resolves to an address.
   * @throws {Error} If the network with the chain id is not supported.
   */
  async execute(
    params: GetAddrFromStarkNameParams,
  ): Promise<GetAddrFromStarkNameResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: GetAddrFromStarkNameParams,
  ): Promise<GetAddrFromStarkNameResponse> {
    const { starkName } = params;

    const address = await getAddrFromStarkNameUtil(this.network, starkName);

    return address;
  }
}

export const getAddrFromStarkName = new GetAddrFromStarkNameRpc();
