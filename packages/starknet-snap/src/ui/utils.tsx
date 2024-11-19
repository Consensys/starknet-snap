import type { FormattedCallData, TransactionRequest } from '../types/snapState';
import { DEFAULT_DECIMAL_PLACES } from '../utils/constants';
import type { ExecuteTxnUIErrors } from './components';
import { ExecuteTxnUI } from './components';
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

/**
 * Generate the interface for a ExecuteTxnUI
 *
 * @param request - TransactionRequest
 * @returns A Promise that resolves to the interface ID generated by the Snap request.
 * The ID can be used for tracking or referencing the created interface.
 */
export async function generateExecuteTxnFlow(
  request: TransactionRequest, // Request must match props and include an `id`
) {
  const {
    signer,
    chainId,
    networkName,
    maxFee,
    calls,
    selectedFeeToken,
    includeDeploy,
  } = request;
  return await snap.request({
    method: 'snap_createInterface',
    params: {
      ui: (
        <ExecuteTxnUI
          signer={signer}
          chainId={chainId}
          networkName={networkName}
          maxFee={maxFee}
          calls={calls}
          selectedFeeToken={selectedFeeToken}
          includeDeploy={includeDeploy}
        />
      ),
      context: {
        request,
      },
    },
  });
}

/**
 * Update the interface for a ExecuteTxnUI
 *
 * @param id - Interface Id
 * @param request - TransactionRequest
 * @param errors
 * @param errors.errors
 */
export async function updateExecuteTxnFlow(
  id: string, // Interface Id to update
  request: TransactionRequest, // Props must include `id` and `interfaceId`
  errors?: { errors: ExecuteTxnUIErrors }, // Optional partial props for error handling or overrides
) {
  const {
    signer,
    chainId,
    networkName,
    maxFee,
    calls,
    selectedFeeToken,
    includeDeploy,
  } = request;
  // Perform the interface update
  await snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui: (
        <ExecuteTxnUI
          signer={signer}
          chainId={chainId}
          networkName={networkName}
          maxFee={maxFee}
          calls={calls}
          selectedFeeToken={selectedFeeToken}
          includeDeploy={includeDeploy}
          {...errors}
        />
      ),
    },
  });
}

export type UpdateInterfaceParams = {
  id: string;
  ui: JSX.Element;
};

/**
 *
 * @param id
 * @param ui
 */
export async function updateInterface(
  id: string,
  ui: JSX.Element,
): Promise<void> {
  await snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui,
    },
  });
}
