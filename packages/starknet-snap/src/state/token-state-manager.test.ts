import { constants } from 'starknet';

import type { Erc20Token } from '../types/snapState';
import {
  ETHER_MAINNET,
  ETHER_SEPOLIA_TESTNET,
  STRK_MAINNET,
  STRK_SEPOLIA_TESTNET,
} from '../utils/constants';
import { mockState } from './__tests__/helper';
import { StateManagerError } from './state-manager';
import { TokenStateManager, ChainIdFilter } from './token-state-manager';

describe('TokenStateManager', () => {
  describe('getToken', () => {
    it('returns the token', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      await mockState({
        tokens: [ETHER_MAINNET, ETHER_SEPOLIA_TESTNET],
      });

      const stateManager = new TokenStateManager();
      const result = await stateManager.getToken({
        chainId,
        address: ETHER_SEPOLIA_TESTNET.address,
      });

      expect(result).toStrictEqual(ETHER_SEPOLIA_TESTNET);
    });

    it('finds the token by symbol', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      await mockState({
        tokens: [ETHER_MAINNET, ETHER_SEPOLIA_TESTNET],
      });

      const stateManager = new TokenStateManager();
      const result = await stateManager.getToken({
        chainId,
        address: ETHER_SEPOLIA_TESTNET.address,
      });

      expect(result).toStrictEqual(ETHER_SEPOLIA_TESTNET);
    });

    it('returns null if the token can not be found', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      await mockState({
        tokens: [ETHER_MAINNET],
      });

      const stateManager = new TokenStateManager();
      const result = await stateManager.getToken({
        chainId,
        address: ETHER_SEPOLIA_TESTNET.address,
      });

      expect(result).toBeNull();
    });
  });

  describe('addDefaultTokens', () => {
    it("adds tokens if the given tokens don't exist", async () => {
      const { state } = await mockState({
        tokens: [],
      });

      const stateManager = new TokenStateManager();
      await stateManager.addDefaultTokens([
        ETHER_MAINNET,
        ETHER_SEPOLIA_TESTNET,
      ]);

      expect(state.erc20Tokens).toStrictEqual([
        ETHER_MAINNET,
        ETHER_SEPOLIA_TESTNET,
      ]);
    });

    it('updates the tokens if the given tokens found', async () => {
      const { state } = await mockState({
        tokens: [ETHER_MAINNET],
      });

      const stateManager = new TokenStateManager();
      await stateManager.addDefaultTokens([
        {
          ...ETHER_MAINNET,
          name: 'Updated Token',
        },
        ETHER_SEPOLIA_TESTNET,
      ]);

      expect(state.erc20Tokens[0]).toStrictEqual({
        ...ETHER_MAINNET,
        name: 'Updated Token',
      });
      expect(state.erc20Tokens[1]).toStrictEqual(ETHER_SEPOLIA_TESTNET);
    });

    it('throws a `StateManagerError` if an error was thrown', async () => {
      const { getDataSpy } = await mockState({
        tokens: [ETHER_MAINNET],
      });
      getDataSpy.mockRejectedValue(new Error('Error'));

      const stateManager = new TokenStateManager();

      await expect(
        stateManager.addDefaultTokens([
          {
            ...ETHER_MAINNET,
            name: 'Updated Token',
          },
          ETHER_SEPOLIA_TESTNET,
        ]),
      ).rejects.toThrow(StateManagerError);
    });
  });

  describe('list', () => {
    it('returns the list of token by chainId', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      await mockState({
        tokens: [ETHER_MAINNET, ETHER_SEPOLIA_TESTNET],
      });

      const stateManager = new TokenStateManager();
      const result = await stateManager.list([new ChainIdFilter([chainId])]);

      expect(result).toStrictEqual([ETHER_SEPOLIA_TESTNET]);
    });

    it('returns empty array if a token with the given chainId cannot be found', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      await mockState({
        tokens: [ETHER_MAINNET],
      });

      const stateManager = new TokenStateManager();
      const result = await stateManager.list([new ChainIdFilter([chainId])]);

      expect(result).toStrictEqual([]);
    });
  });

  describe('updateToken', () => {
    it('updates the token', async () => {
      const { state } = await mockState({
        tokens: [ETHER_MAINNET],
      });

      const stateManager = new TokenStateManager();
      const updatedEntity = {
        ...ETHER_MAINNET,
        name: 'Updated Token',
      };
      await stateManager.updateToken(updatedEntity);

      expect(state.erc20Tokens[0]).toStrictEqual(updatedEntity);
    });

    it('throws `Token does not exist` error if the update entity can not be found', async () => {
      await mockState({
        tokens: [ETHER_MAINNET],
      });

      const stateManager = new TokenStateManager();
      const updatedEntity = {
        ...ETHER_SEPOLIA_TESTNET,
        name: 'Updated Token',
      };

      await expect(stateManager.updateToken(updatedEntity)).rejects.toThrow(
        'Token does not exist',
      );
    });
  });

  describe('getEthToken', () => {
    it.each([
      {
        chainId: constants.StarknetChainId.SN_MAIN,
        token: ETHER_MAINNET,
      },
      {
        chainId: constants.StarknetChainId.SN_SEPOLIA,
        token: ETHER_SEPOLIA_TESTNET,
      },
    ])(
      'returns the ETH token if the chain id is $chainId',
      async ({ chainId, token }: { chainId: string; token: Erc20Token }) => {
        await mockState({
          tokens: [token],
        });

        const stateManager = new TokenStateManager();
        const result = await stateManager.getEthToken({
          chainId,
        });

        expect(result).toStrictEqual(token);
      },
    );

    it('returns null if the ETH token is null or undefined', async () => {
      await mockState({
        tokens: [ETHER_MAINNET],
      });

      const stateManager = new TokenStateManager();
      const result = await stateManager.getEthToken({
        chainId: constants.StarknetChainId.SN_SEPOLIA,
      });

      expect(result).toBeNull();
    });

    it('returns null if the chain id is not supported', async () => {
      await mockState({
        tokens: [ETHER_MAINNET],
      });

      const stateManager = new TokenStateManager();
      const result = await stateManager.getEthToken({
        chainId: 'invalid-chain-id',
      });

      expect(result).toBeNull();
    });
  });

  describe('getStrkToken', () => {
    it.each([
      {
        chainId: constants.StarknetChainId.SN_MAIN,
        token: STRK_MAINNET,
      },
      {
        chainId: constants.StarknetChainId.SN_SEPOLIA,
        token: STRK_SEPOLIA_TESTNET,
      },
    ])(
      'return the STRK token if the chain id is $chainId',
      async ({ chainId, token }: { chainId: string; token: Erc20Token }) => {
        await mockState({
          tokens: [token],
        });

        const stateManager = new TokenStateManager();
        const result = await stateManager.getStrkToken({
          chainId,
        });

        expect(result).toStrictEqual(token);
      },
    );

    it('returns null if the STRK token is null or undefined', async () => {
      await mockState({
        tokens: [STRK_MAINNET],
      });

      const stateManager = new TokenStateManager();
      const result = await stateManager.getStrkToken({
        chainId: constants.StarknetChainId.SN_SEPOLIA,
      });

      expect(result).toBeNull();
    });

    it('returns null if the chain id is not supported', async () => {
      await mockState({
        tokens: [STRK_SEPOLIA_TESTNET],
      });

      const stateManager = new TokenStateManager();
      const result = await stateManager.getStrkToken({
        chainId: 'invalid-chain-id',
      });

      expect(result).toBeNull();
    });
  });

  describe('addToken', () => {
    it('adds the token', async () => {
      const { state } = await mockState({
        tokens: [ETHER_MAINNET],
      });

      const stateManager = new TokenStateManager();
      await stateManager.addToken(ETHER_SEPOLIA_TESTNET);

      expect(state.erc20Tokens[1]).toStrictEqual(ETHER_SEPOLIA_TESTNET);
    });

    it('throws a `Token already exist` error if the token is exist', async () => {
      const { setDataSpy } = await mockState({
        tokens: [ETHER_MAINNET],
      });
      setDataSpy.mockRejectedValue(new Error('Error'));

      const stateManager = new TokenStateManager();

      await expect(stateManager.addToken(ETHER_MAINNET)).rejects.toThrow(
        StateManagerError,
      );
    });
  });

  describe('upsertToken', () => {
    const createTokenToUpsert = () => {
      return {
        address: '0x123455',
        symbol: 'TO',
        name: 'Token',
        decimals: 18,
        chainId: constants.StarknetChainId.SN_SEPOLIA,
      };
    };
    it('adds the token to state if it does not exist', async () => {
      const token = createTokenToUpsert();
      const { state } = await mockState({
        tokens: [ETHER_MAINNET],
      });

      const stateManager = new TokenStateManager();
      await stateManager.upsertToken(token);

      expect(state.erc20Tokens[1]).toStrictEqual(token);
    });

    it('updates the token in state if it exists', async () => {
      const token = createTokenToUpsert();
      const { state } = await mockState({
        tokens: [ETHER_MAINNET, token],
      });

      const updatedEntity = {
        ...token,
        name: 'Updated Token',
      };

      const stateManager = new TokenStateManager();
      await stateManager.upsertToken(updatedEntity);

      expect(state.erc20Tokens[1]).toStrictEqual(updatedEntity);
    });
  });
});
