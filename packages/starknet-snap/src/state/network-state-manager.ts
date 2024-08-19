import { assert, string } from 'superstruct';

import type { Network, SnapState } from '../types/snapState';
import type { IFilter } from './filter';
import { ChainIdFilter as BaseChainIdFilter } from './filter';
import { StateManager, StateManagerError } from './state-manager';

export type INetworkFilter = IFilter<Network>;

export class ChainIdFilter
  extends BaseChainIdFilter<Network>
  implements INetworkFilter {}

export class NetworkStateManager extends StateManager<Network> {
  protected getCollection(state: SnapState): Network[] {
    return state.networks;
  }

  protected updateEntity(dataInState: Network, data: Network): void {
    assert(dataInState.name, string());

    dataInState.name = data.name;
    dataInState.nodeUrl = data.nodeUrl;
  }

  /**
   * Add default network by the given chainId.
   * If the network object not exist, it will be added.
   * If the network object exist, it will be updated.
   *
   * @param networks - An array of the networks object.
   * @returns A Promise that resolves when the operation is complete.
   */
  async addDefaultNetworks(networks: Network[]): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        // Build a map of chainId to Network object from the current state.
        const chainMap = new Map<bigint, Network>();
        for (const network of state.networks) {
          const key = BigInt(network.chainId);
          chainMap.set(key, network);
        }

        // Check if the network already exists in the state. True - update the network object, False - insert the network object.
        for (const network of networks) {
          // Same comparison as chainIdFilter.
          const data = chainMap.get(BigInt(network.chainId));
          if (data === undefined) {
            state.networks.push(network);
          } else {
            this.updateEntity(data, network);
          }
        }
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Finds a network based on the given chainId.
   *
   * @param param - The param object.
   * @param param.chainId - The chainId to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the Network object if found, or null if not found.
   */
  async findNetwork(
    {
      chainId,
    }: {
      chainId: string;
    },
    state?: SnapState,
  ): Promise<Network | null> {
    const filters: INetworkFilter[] = [new ChainIdFilter([chainId])];
    return this.find(filters, state);
  }

  /**
   * Updates a network in the state with the given data.
   *
   * @param data - The updated Network object.
   * @returns A Promise that resolves when the update is complete.
   * @throws {StateManagerError} If there is an error updating the network, such as:
   * If the network to be updated does not exist in the state.
   */
  async updateNetwork(data: Network): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const dataInState = await this.findNetwork(
          {
            chainId: data.chainId,
          },
          state,
        );

        if (!dataInState) {
          throw new Error(`Network does not exist`);
        }
        this.updateEntity(dataInState, data);
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Gets the current network from the state.
   *
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the current Network object if found, or null if not found.
   */
  async getCurrentNetwork(state?: SnapState): Promise<Network | null> {
    return (state ?? (await this.get())).currentNetwork ?? null;
  }

  /**
   * Sets the current network in the state with the given data.
   *
   * @param data - The Network object to set as the current network.
   * @returns A Promise that resolves when the update is complete.
   * @throws {StateManagerError} If there is an error setting the current network.
   */
  async setCurrentNetwork(data: Network): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        state.currentNetwork = data;
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }
}
