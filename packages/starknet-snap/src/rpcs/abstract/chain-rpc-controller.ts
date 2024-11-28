import type { Json } from '@metamask/snaps-sdk';

import { NetworkStateManager } from '../../state/network-state-manager';
import type { Network } from '../../types/snapState';
import { InvalidNetworkError } from '../../utils/exceptions';
import { RpcController } from './base-rpc-controller';

/**
 * A base class for all RPC controllers that require a chainId to be provided in the request parameters.
 *
 * @template Request - The expected structure of the request parameters that contains the chainId property.
 * @template Response - The expected structure of the response.
 * @augments RpcController - The base class for all RPC controllers.
 * @class ChainRpcController
 */
export abstract class ChainRpcController<
  Request extends {
    chainId: string;
  },
  Response extends Json,
> extends RpcController<Request, Response> {
  protected network: Network;

  protected networkStateMgr: NetworkStateManager;

  constructor() {
    super();
    this.networkStateMgr = new NetworkStateManager();
  }

  protected async getNetwork(chainId: string): Promise<Network> {
    const network = await this.networkStateMgr.getNetwork({ chainId });
    // if the network is not in the list of networks that we support, we throw an error
    if (!network) {
      throw new InvalidNetworkError() as unknown as Error;
    }

    return network;
  }

  protected async preExecute(params: Request): Promise<void> {
    await super.preExecute(params);

    const { chainId } = params;

    this.network = await this.getNetwork(chainId);
  }
}
