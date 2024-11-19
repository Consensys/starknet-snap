import type { FormattedCallData } from '../types/snapState';
import { DEFAULT_DECIMAL_PLACES } from '../utils/constants';
import { accumulateTotals } from './utils';

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
  ])('sums up transfer amounts for $selectedFeeToken', ({ selectedFeeToken, expectedResult }) => {
    const calls = mockCalls();
  
    const result = accumulateTotals(calls, mockMaxFee, selectedFeeToken);
  
    expect(result).toStrictEqual(expectedResult);
  });

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
