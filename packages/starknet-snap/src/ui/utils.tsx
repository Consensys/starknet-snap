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
  return calls.reduce(
    (acc, call) => {
      if (call.tokenTransferData) {
        const amount = BigInt(call.tokenTransferData.amount); // Convert to BigInt
        if (!acc[call.tokenTransferData.symbol]) {
          acc[call.tokenTransferData.symbol] = {
            amount: BigInt(0),
            decimals: call.tokenTransferData.decimals,
          };
        }
        acc[call.tokenTransferData.symbol].amount += amount;
      }
      return acc;
    },
    {
      // We derive decimals based on the fee token. Currently, both supported fee tokens, ETH and STRK, use the standard 18 decimals.
      // Therefore, we use DEFAULT_DECIMAL_PLACES set to 18 here. If additional fee tokens with different decimals are introduced,
      // this logic should be updated to handle token-specific decimals dynamically.
      [selectedFeeToken]: {
        amount: BigInt(maxFee),
        decimals: DEFAULT_DECIMAL_PLACES,
      },
    },
  );
};
