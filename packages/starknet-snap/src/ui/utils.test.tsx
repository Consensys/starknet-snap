import { TokenStateManager } from '../state/token-state-manager';
import { FeeToken } from '../types/snapApi';
import type { FormattedCallData, Network } from '../types/snapState';
import {
  DEFAULT_DECIMAL_PLACES,
  BlockIdentifierEnum,
  ETHER_SEPOLIA_TESTNET,
  STRK_SEPOLIA_TESTNET,
} from '../utils/constants';
import * as starknetUtils from '../utils/starknetUtils';
import { accumulateTotals, hasSufficientFunds } from './utils';

describe('accumulateTotals', () => {
  const mockCalls = (overrides = [{}]) =>
    [
      {
        tokenTransferData: {
          amount: '1000000000000000000', // 1 ETH as string BigInt
          symbol: 'ETH',
          decimals: 18,
          ...overrides[0],
        },
      },
      {
        tokenTransferData: {
          amount: '500000000000000000', // 0.5 ETH as string BigInt
          symbol: 'ETH',
          decimals: 18,
          ...overrides[1],
        },
      },
      {
        tokenTransferData: {
          amount: '2000000000000000000', // 2 STRK as string BigInt
          symbol: 'STRK',
          decimals: 18,
          ...overrides[2],
        },
      },
    ] as FormattedCallData[];

  const mockMaxFee = '100000000000000000'; // 0.1 token fee

  it.each([
    {
      selectedFeeToken: 'ETH',
      expectedResult: {
        ETH: {
          amount: BigInt('1600000000000000000'), // 1 + 0.5 + 0.1 ETH
          decimals: 18,
        },
        STRK: {
          amount: BigInt('2000000000000000000'), // 2 STRK
          decimals: 18,
        },
      },
    },
    {
      selectedFeeToken: 'STRK',
      expectedResult: {
        ETH: {
          amount: BigInt('1500000000000000000'), // 1 + 0.5 ETH
          decimals: 18,
        },
        STRK: {
          amount: BigInt('2100000000000000000'), // 2 + 0.1 STRK
          decimals: 18,
        },
      },
    },
  ])(
    'sums up transfer amounts for $selectedFeeToken',
    ({ selectedFeeToken, expectedResult }) => {
      const calls = mockCalls();

      const result = accumulateTotals(calls, mockMaxFee, selectedFeeToken);

      expect(result).toStrictEqual(expectedResult);
    },
  );

  it('creates a new token entry if the fee token was not part of calls', () => {
    const calls = mockCalls();
    const selectedFeeToken = 'STRK';

    const result = accumulateTotals(calls, mockMaxFee, selectedFeeToken);

    expect(result).toStrictEqual({
      ETH: {
        amount: BigInt('1500000000000000000'), // 1 + 0.5 ETH
        decimals: 18,
      },
      STRK: {
        amount: BigInt('2100000000000000000'), // 2 + 0.1 STRK
        decimals: 18,
      },
    });
  });

  it('handles no calls gracefully', () => {
    const calls = [];
    const selectedFeeToken = 'ETH';

    const result = accumulateTotals(calls, mockMaxFee, selectedFeeToken);

    expect(result).toStrictEqual({
      ETH: {
        amount: BigInt('100000000000000000'), // 0.1 ETH (fee only)
        decimals: DEFAULT_DECIMAL_PLACES,
      },
    });
  });
});

describe('hasSufficientFunds', () => {
  const mockAddress = '0xTestAddress';
  const mockNetwork = { chainId: '1' } as Network;
  const mockSuggestedMaxFee = '1000';

  // Utility function to prepare and return spies
  /**
   *
   */
  function prepareSpy() {
    const getBalanceSpy = jest.spyOn(starknetUtils, 'getBalance');

    jest
      .spyOn(TokenStateManager.prototype, 'getStrkToken')
      .mockResolvedValue(STRK_SEPOLIA_TESTNET);

    jest
      .spyOn(TokenStateManager.prototype, 'getEthToken')
      .mockResolvedValue(ETHER_SEPOLIA_TESTNET);

    return { getBalanceSpy };
  }

  it('returns true when STRK balance is sufficient for calls and fee', async () => {
    const { getBalanceSpy } = prepareSpy();

    getBalanceSpy.mockResolvedValueOnce('2000'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: STRK_SEPOLIA_TESTNET.address, amount: '500' }],
      FeeToken.STRK,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(true);
    expect(getBalanceSpy).toHaveBeenCalledWith(
      mockAddress,
      STRK_SEPOLIA_TESTNET.address,
      mockNetwork,
      BlockIdentifierEnum.Pending,
    );
  });

  it('returns false when STRK balance is insufficient', async () => {
    const { getBalanceSpy } = prepareSpy();
    getBalanceSpy.mockResolvedValueOnce('1000'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: STRK_SEPOLIA_TESTNET.address, amount: '1500' }],
      FeeToken.STRK,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(false);
  });

  it('returns true when ETH balance is sufficient for calls and fee', async () => {
    const { getBalanceSpy } = prepareSpy();
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('2000'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: ETHER_SEPOLIA_TESTNET.address, amount: '500' }],
      FeeToken.ETH,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(true);
    expect(getBalanceSpy).toHaveBeenCalledWith(
      mockAddress,
      ETHER_SEPOLIA_TESTNET.address,
      mockNetwork,
      BlockIdentifierEnum.Pending,
    );
  });

  it('returns false when ETH balance is insufficient', async () => {
    const { getBalanceSpy } = prepareSpy();
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('1000'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: ETHER_SEPOLIA_TESTNET.address, amount: '1500' }],
      FeeToken.ETH,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(false);
  });
});
