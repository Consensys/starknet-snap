import { constants } from 'starknet';

import { Config } from '../config';
import type { Network } from '../types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  STARKNET_TESTNET_NETWORK,
} from '../utils/constants';
import { mockState } from './__tests__/helper';
import { NetworkStateManager, ChainIdFilter } from './network-state-manager';
import { StateManagerError } from './state-manager';

describe('NetworkStateManager', () => {
  describe('getNetwork', () => {
    it('returns the network', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      await mockState({
        networks: Config.availableNetworks,
      });

      const stateManager = new NetworkStateManager();
      const result = await stateManager.getNetwork({
        chainId,
      });

      expect(result).toStrictEqual(STARKNET_SEPOLIA_TESTNET_NETWORK);
    });

    it('looks up the configuration if the network cant be found in state', async () => {
      await mockState({
        networks: [STARKNET_MAINNET_NETWORK],
      });

      const stateManager = new NetworkStateManager();
      const result = await stateManager.getNetwork({
        chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      });

      expect(result).toStrictEqual(STARKNET_SEPOLIA_TESTNET_NETWORK);
    });

    it('returns null if the network can not be found', async () => {
      await mockState({
        networks: Config.availableNetworks,
      });

      const stateManager = new NetworkStateManager();
      const result = await stateManager.getNetwork({
        chainId: '0x9999',
      });

      expect(result).toBeNull();
    });
  });

  describe('addDefaultNetworks', () => {
    it("adds the networks if the given networks don't exist", async () => {
      const { state } = await mockState({
        networks: [],
      });

      const stateManager = new NetworkStateManager();
      await stateManager.addDefaultNetworks([
        STARKNET_MAINNET_NETWORK,
        STARKNET_SEPOLIA_TESTNET_NETWORK,
      ]);

      expect(state.networks).toStrictEqual([
        STARKNET_MAINNET_NETWORK,
        STARKNET_SEPOLIA_TESTNET_NETWORK,
      ]);
    });

    it('updates the networks if the given networks found', async () => {
      const { state } = await mockState({
        networks: [STARKNET_MAINNET_NETWORK],
      });

      const stateManager = new NetworkStateManager();
      await stateManager.addDefaultNetworks([
        {
          ...STARKNET_MAINNET_NETWORK,
          name: 'Updated Network',
        },
        STARKNET_SEPOLIA_TESTNET_NETWORK,
      ]);

      expect(state.networks[0]).toStrictEqual({
        ...STARKNET_MAINNET_NETWORK,
        name: 'Updated Network',
      });
      expect(state.networks[1]).toStrictEqual(STARKNET_SEPOLIA_TESTNET_NETWORK);
    });

    it('throws a `StateManagerError` if an error was thrown', async () => {
      const { getDataSpy } = await mockState({
        networks: [STARKNET_MAINNET_NETWORK],
      });
      getDataSpy.mockRejectedValue(new Error('Error'));

      const stateManager = new NetworkStateManager();

      await expect(
        stateManager.addDefaultNetworks([
          {
            ...STARKNET_MAINNET_NETWORK,
            name: 'Updated Network',
          },
          STARKNET_SEPOLIA_TESTNET_NETWORK,
        ]),
      ).rejects.toThrow(StateManagerError);
    });
  });

  describe('list', () => {
    it('returns the list of network by chainId', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      await mockState({
        networks: Config.availableNetworks,
      });

      const stateManager = new NetworkStateManager();
      const result = await stateManager.list([new ChainIdFilter([chainId])]);

      expect(result).toStrictEqual([STARKNET_SEPOLIA_TESTNET_NETWORK]);
    });

    it('returns empty array if a network with the given chainId cannot be found', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      await mockState({
        networks: [STARKNET_MAINNET_NETWORK],
      });

      const stateManager = new NetworkStateManager();
      const result = await stateManager.list([new ChainIdFilter([chainId])]);

      expect(result).toStrictEqual([]);
    });
  });

  describe('updateNetwork', () => {
    it('updates the network', async () => {
      const { state } = await mockState({
        networks: [STARKNET_MAINNET_NETWORK],
      });

      const stateManager = new NetworkStateManager();
      const updatedEntity = {
        ...STARKNET_MAINNET_NETWORK,
        name: 'Updated Network',
        nodeUrl: 'http://localhost:8080',
      };
      await stateManager.updateNetwork(updatedEntity);

      expect(state.networks[0]).toStrictEqual(updatedEntity);
    });

    it('throws `Network does not exist` error if the update entity can not be found', async () => {
      await mockState({
        networks: [STARKNET_MAINNET_NETWORK],
      });

      const stateManager = new NetworkStateManager();
      const updatedEntity = {
        ...STARKNET_SEPOLIA_TESTNET_NETWORK,
        name: 'Updated Network',
        nodeUrl: 'http://localhost:8080',
      };

      await expect(stateManager.updateNetwork(updatedEntity)).rejects.toThrow(
        'Network does not exist',
      );
    });
  });

  describe('getCurrentNetwork', () => {
    it('get the current network', async () => {
      await mockState({
        networks: Config.availableNetworks,
        currentNetwork: STARKNET_MAINNET_NETWORK,
      });

      const stateManager = new NetworkStateManager();
      const result = await stateManager.getCurrentNetwork();

      expect(result).toStrictEqual(STARKNET_MAINNET_NETWORK);
    });

    it(`returns default network if the current network is null or undefined`, async () => {
      await mockState({
        networks: Config.availableNetworks,
      });

      const stateManager = new NetworkStateManager();
      const result = await stateManager.getCurrentNetwork();

      expect(result).toStrictEqual(Config.defaultNetwork);
    });

    it(`returns default network if the current network is neither mainnet or sepolia testnet`, async () => {
      await mockState({
        networks: Config.availableNetworks,
        currentNetwork: STARKNET_TESTNET_NETWORK,
      });

      const stateManager = new NetworkStateManager();
      const result = await stateManager.getCurrentNetwork();

      expect(result).toStrictEqual(Config.defaultNetwork);
    });
  });

  describe('setCurrentNetwork', () => {
    it.each([
      {
        status: 'undefined',
        currentNetwork: undefined,
        updateTo: STARKNET_SEPOLIA_TESTNET_NETWORK,
      },
      {
        status: 'same',
        currentNetwork: STARKNET_MAINNET_NETWORK,
        updateTo: STARKNET_MAINNET_NETWORK,
      },
      {
        status: 'different',
        currentNetwork: STARKNET_MAINNET_NETWORK,
        updateTo: STARKNET_SEPOLIA_TESTNET_NETWORK,
      },
    ])(
      'set the current network when the current network is $status',
      async ({
        currentNetwork,
        updateTo,
      }: {
        status: string;
        currentNetwork: Network;
        updateTo: Network;
      }) => {
        const { state } = await mockState({
          networks: Config.availableNetworks,
          currentNetwork,
        });

        const stateManager = new NetworkStateManager();
        await stateManager.setCurrentNetwork(updateTo);

        expect(state.currentNetwork).toStrictEqual(updateTo);
      },
    );

    it('throws a `StateManagerError` if an error was thrown', async () => {
      const { setDataSpy } = await mockState({
        networks: [STARKNET_MAINNET_NETWORK],
      });
      setDataSpy.mockRejectedValue(new Error('Error'));

      const stateManager = new NetworkStateManager();

      await expect(
        stateManager.setCurrentNetwork(STARKNET_SEPOLIA_TESTNET_NETWORK),
      ).rejects.toThrow(StateManagerError);
    });
  });
});
