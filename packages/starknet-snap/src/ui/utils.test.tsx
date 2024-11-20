import type { FormattedCallData, Network } from '../types/snapState';
import {
  DEFAULT_DECIMAL_PLACES,
  BlockIdentifierEnum,
} from '../utils/constants';
import * as starknetUtils from '../utils/starknetUtils';
import { accumulateTotals, hasSufficientFundsForFee } from './utils';

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

describe('hasSufficientFundsForFee', () => {
  const mockAddress = '0xTestAddress';
  const mockNetwork = { chainId: '1' } as Network;
  const mockSuggestedMaxFee = '1000';
  const mockFeeTokenAddress = '0xFeeTokenAddress';

  // Utility function to prepare and return spies
  /**
   *
   */
  function prepareSpy() {
    const getBalanceSpy = jest.spyOn(starknetUtils, 'getBalance');
    return { getBalanceSpy };
  }

  it('returns true when balance for fee token is sufficient for calls and fee', async () => {
    const { getBalanceSpy } = prepareSpy();

    getBalanceSpy.mockResolvedValueOnce('3000'); // Mock fee token balance

    const result = await hasSufficientFundsForFee({
      feeTokenAddress: mockFeeTokenAddress,
      suggestedMaxFee: mockSuggestedMaxFee,
      network: mockNetwork,
      address: mockAddress,
      calls: [
        {
          entrypoint: 'transfer',
          contractAddress: mockFeeTokenAddress,
          tokenTransferData: {
            amount: '1500',
            senderAddress: '',
            recipientAddress: '',
            decimals: 18,
            symbol: 'ETH',
          },
        },
      ],
    });

    expect(result).toBe(true);
    expect(getBalanceSpy).toHaveBeenCalledWith(
      mockAddress,
      mockFeeTokenAddress,
      mockNetwork,
      BlockIdentifierEnum.Pending,
    );
  });

  it('returns false when balance for fee token is insufficient', async () => {
    const { getBalanceSpy } = prepareSpy();

    getBalanceSpy.mockResolvedValueOnce('2000'); // Mock fee token balance

    const result = await hasSufficientFundsForFee({
      feeTokenAddress: mockFeeTokenAddress,
      suggestedMaxFee: mockSuggestedMaxFee,
      network: mockNetwork,
      address: mockAddress,
      calls: [
        {
          entrypoint: 'transfer',
          contractAddress: mockFeeTokenAddress,
          tokenTransferData: {
            amount: '1500',
            senderAddress: '',
            recipientAddress: '',
            decimals: 18,
            symbol: 'ETH',
          },
        },
      ],
    });

    expect(result).toBe(false);
  });

  it('returns true when no calls are made and balance is sufficient for fee', async () => {
    const { getBalanceSpy } = prepareSpy();

    getBalanceSpy.mockResolvedValueOnce('2000'); // Mock fee token balance

    const result = await hasSufficientFundsForFee({
      feeTokenAddress: mockFeeTokenAddress,
      suggestedMaxFee: mockSuggestedMaxFee,
      network: mockNetwork,
      address: mockAddress,
      calls: [], // No calls
    });

    expect(result).toBe(true);
  });

  it('returns false when no balance is available for fee token', async () => {
    const { getBalanceSpy } = prepareSpy();

    getBalanceSpy.mockResolvedValueOnce('0'); // Mock fee token balance

    const result = await hasSufficientFundsForFee({
      feeTokenAddress: mockFeeTokenAddress,
      suggestedMaxFee: mockSuggestedMaxFee,
      network: mockNetwork,
      address: mockAddress,
      calls: [
        {
          entrypoint: 'transfer',
          contractAddress: mockFeeTokenAddress,
          tokenTransferData: {
            amount: '1500',
            senderAddress: '',
            recipientAddress: '',
            decimals: 18,
            symbol: 'ETH',
          },
        },
      ],
    });

    expect(result).toBe(false);
  });

  it('ignores calls not involving the fee token address', async () => {
    const { getBalanceSpy } = prepareSpy();

    getBalanceSpy.mockResolvedValueOnce('2000'); // Mock fee token balance

    const result = await hasSufficientFundsForFee({
      feeTokenAddress: mockFeeTokenAddress,
      suggestedMaxFee: mockSuggestedMaxFee,
      network: mockNetwork,
      address: mockAddress,
      calls: [
        {
          entrypoint: 'transfer',
          contractAddress: 'OtherToken',
          tokenTransferData: {
            amount: '1500',
            senderAddress: '',
            recipientAddress: '',
            decimals: 18,
            symbol: 'ETH',
          },
        },
      ],
    });

    expect(result).toBe(true); // Fee token balance is not affected by unrelated calls
  });
});
