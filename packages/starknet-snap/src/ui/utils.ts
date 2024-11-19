import type { FormattedCallData } from '../types/snapState';
import { DEFAULT_DECIMAL_PLACES } from '../utils/constants';
import type { TokenTotals } from './types';

/**
 * Accumulate the total amount for all tokens involved in calls and fees.
 *
 * @param calls - The array of FormattedCallData object.
 * @param maxFee - The maximum fee.
 * @param selectedFeeToken - The selected token symbol for fees.
 * @returns The accumulated totals for each token.
 */
export const accumulateTotals = (
  calls: FormattedCallData[],
  maxFee: string,
  selectedFeeToken: string,
): TokenTotals => {
  const tokenTotals: TokenTotals = {};

  // Sum up transfer amounts for each token
  calls.forEach((call) => {
    if (
      call.transferAmount &&
      call.transferTokenSymbol &&
      call.transferTokenDecimals &&
      call.isTransfer
    ) {
      const amount = BigInt(call.transferAmount); // Convert to BigInt
      if (!tokenTotals[call.transferTokenSymbol]) {
        tokenTotals[call.transferTokenSymbol] = {
          amount: BigInt(0),
          decimals: call.transferTokenDecimals,
        };
      }
      tokenTotals[call.transferTokenSymbol].amount += amount;
    }
  });
  // Add the fee to the corresponding token
  const feeTokenAmount = BigInt(maxFee);
  if (tokenTotals[selectedFeeToken]) {
    tokenTotals[selectedFeeToken].amount += feeTokenAmount;
  } else {
    // We derive decimals based on the fee token. Currently, both supported fee tokens, ETH and STRK, use the standard 18 decimals.
    // Therefore, we use DEFAULT_DECIMAL_PLACES set to 18 here. If additional fee tokens with different decimals are introduced,
    // this logic should be updated to handle token-specific decimals dynamically.
    tokenTotals[selectedFeeToken] = {
      amount: feeTokenAmount,
      decimals: DEFAULT_DECIMAL_PLACES,
    };
  }

  return tokenTotals;
};
