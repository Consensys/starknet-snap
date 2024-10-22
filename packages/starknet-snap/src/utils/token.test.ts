import { constants } from 'starknet';

import { Config } from '../config';
import type { Erc20Token } from '../types/snapState';
import { isPreloadedToken } from './token';

describe('isPreloadedToken', () => {
  it.each(Config.preloadTokens)(
    'returns true if the token is a preloaded token',
    (token: Erc20Token) => {
      expect(
        isPreloadedToken({
          tokenName: token.name,
          tokenSymbol: token.symbol,
          tokenAddress: token.address,
          chainId: token.chainId,
        }),
      ).toBe(true);
    },
  );

  it.each([
    // To test the case where the token is a preloaded token but with different name, symbol, address
    {
      ...Config.preloadTokens[0],
      name: 'different name',
    },
    {
      ...Config.preloadTokens[0],
      symbol: 'different symbol',
    },
    {
      ...Config.preloadTokens[0],
      address: '0x12345',
    },
  ])(
    'returns true if the token is a preloaded token but with different name, symbol, address',
    (token: Erc20Token) => {
      expect(
        isPreloadedToken({
          tokenName: token.name,
          tokenSymbol: token.symbol,
          tokenAddress: token.address,
          chainId: token.chainId,
        }),
      ).toBe(true);
    },
  );

  it('returns false if the token is not a preloaded token', () => {
    expect(
      isPreloadedToken({
        tokenName: 'New Token',
        tokenSymbol: 'NT',
        tokenAddress: '0x12345',
        chainId: constants.StarknetChainId.SN_SEPOLIA,
      }),
    ).toBe(false);
  });
});
