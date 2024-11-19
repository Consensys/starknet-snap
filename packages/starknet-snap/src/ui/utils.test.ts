import type { FormattedCallData } from '../types/snapState';
import { DEFAULT_DECIMAL_PLACES } from '../utils/constants';
import { accumulateTotals } from './utils';

describe('calculateTotals', () => {
  const mockCalls = (overrides = [{}]) => [
    {
      isTransfer: true,
      transferAmount: '1000000000000000000', // 1 ETH as string BigInt
      transferTokenSymbol: 'ETH',
      transferTokenDecimals: 18,
      ...overrides[0],
    } as FormattedCallData,
    {
      isTransfer: true,
      transferAmount: '500000000000000000', // 0.5 ETH as string BigInt
      transferTokenSymbol: 'ETH',
      transferTokenDecimals: 18,
      ...overrides[1],
    } as FormattedCallData,
    {
      isTransfer: true,
      transferAmount: '2000000000000000000', // 2 STRK as string BigInt
      transferTokenSymbol: 'STRK',
      transferTokenDecimals: 18,
      ...overrides[2],
    } as FormattedCallData,
  ];

  const mockMaxFee = '100000000000000000'; // 0.1 token fee

  it('sums up transfer amounts for each token', () => {
    const calls = mockCalls();
    const selectedFeeToken = 'ETH';

    const result = accumulateTotals(calls, mockMaxFee, selectedFeeToken);

    expect(result).toStrictEqual({
      ETH: {
        amount: BigInt('1600000000000000000'), // 1 + 0.5 + 0.1 ETH
        decimals: 18,
      },
      STRK: {
        amount: BigInt('2000000000000000000'), // 2 STRK
        decimals: 18,
      },
    });
  });

  it('handles fee-only transactions when there are no transfers', () => {
    const calls = mockCalls([
      { isTransfer: false },
      { isTransfer: false },
      { isTransfer: false },
    ]);
    const selectedFeeToken = 'STRK';
    const result = accumulateTotals(calls, mockMaxFee, selectedFeeToken);

    expect(result).toStrictEqual({
      STRK: {
        amount: BigInt('100000000000000000'), // 0.1 STRK
        decimals: DEFAULT_DECIMAL_PLACES,
      },
    });
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

  it('ignores invalid transfer data and only processes valid calls', () => {
    const calls = mockCalls([
      { transferAmount: undefined }, // Invalid transfer
      { transferTokenSymbol: undefined }, // Invalid transfer
      { isTransfer: false }, // Not a transfer
    ]);
    const selectedFeeToken = 'ETH';

    const result = accumulateTotals(calls, mockMaxFee, selectedFeeToken);

    expect(result).toStrictEqual({
      ETH: {
        amount: BigInt('100000000000000000'), // 0.1 ETH (fee only)
        decimals: DEFAULT_DECIMAL_PLACES,
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
