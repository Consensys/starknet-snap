import { assert, string } from 'superstruct';

import { Config } from '../config';
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
   * The query will first be looked up in the state. If the result is false, it will then fallback to the available Networks constants.
   *
   * (Note) Due to the returned network object may not exist in the state, it may failed to execute `updateNetwork` with the returned network object.
   *
   * @param param - The param object.
   * @param param.chainId - The chainId to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the Network object if found, or null if not found.
   */
  async getNetwork(
    {
      chainId,
    }: {
      chainId: string;
    },
    state?: SnapState,
  ): Promise<Network | null> {
    const filters: INetworkFilter[] = [new ChainIdFilter([chainId])];
    // in case the network not found from the state, try to get the network from the available Networks constants
    return (
      (await this.find(filters, state)) ??
      Config.availableNetworks.find((network) => network.chainId === chainId) ??
      null
    );
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
        // Use underlying function `find` to avoid searching network from constants
        const dataInState = await this.find(
          [new ChainIdFilter([data.chainId])],
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
  async getCurrentNetwork(state?: SnapState): Promise<Network> {
    const { currentNetwork } = state ?? (await this.get());

    // Make sure the current network is either Sepolia testnet or Mainnet. By default it will be Mainnet.
    if (
      !currentNetwork ||
      !Config.availableNetworks.find(
        (network) => network.chainId === currentNetwork.chainId,
      )
    ) {
      return Config.defaultNetwork;
    }

    return currentNetwork;
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
