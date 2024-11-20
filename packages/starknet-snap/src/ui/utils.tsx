import type { DialogResult } from '@metamask/snaps-sdk';
import { DialogType } from '@metamask/snaps-sdk';

import type { FormattedCallData, TransactionRequest } from '../types/snapState';
import { DEFAULT_DECIMAL_PLACES } from '../utils/constants';
import { ExecuteTxnUI } from './components';
import {
  DisplayPrivateKeyAlertUI,
  DisplayPrivateKeyDialogUI,
} from './components/DisplayPrivateKeyUI';
import type { SignDeclareTransactionUIProps } from './components/SignDeclareTransactionUI';
import { SignDeclareTransactionUI } from './components/SignDeclareTransactionUI';
import type { SignMessageUIProps } from './components/SignMessageUI';
import { SignMessageUI } from './components/SignMessageUI';
import type { SignTransactionUIProps } from './components/SignTransactionUI';
import { SignTransactionUI } from './components/SignTransactionUI';
import type { SwitchNetworkUIProps } from './components/SwitchNetworkUI';
import { SwitchNetworkUI } from './components/SwitchNetworkUI';
import type { WatchAssetUIProps } from './components/WatchAssetUI';
import { WatchAssetUI } from './components/WatchAssetUI';
import type { TokenTotals } from './types';

/**
 *
 * @param props
 */
export async function renderWatchAssetUI(
  props: WatchAssetUIProps,
): Promise<DialogResult> {
  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: <WatchAssetUI {...props} />,
    },
  });
}

/**
 *
 * @param props
 */
export async function renderSwitchNetworkUI(
  props: SwitchNetworkUIProps,
): Promise<DialogResult> {
  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: <SwitchNetworkUI {...props} />,
    },
  });
}

/**
 *
 * @param props
 */
export async function renderSignTransactionUI(
  props: SignTransactionUIProps,
): Promise<DialogResult> {
  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: <SignTransactionUI {...props} />,
    },
  });
}

/**
 *
 * @param props
 */
export async function renderSignMessageUI(
  props: SignMessageUIProps,
): Promise<DialogResult> {
  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: <SignMessageUI {...props} />,
    },
  });
}

/**
 *
 * @param props
 */
export async function renderSignDeclareTransactionUI(
  props: SignDeclareTransactionUIProps,
): Promise<DialogResult> {
  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: <SignDeclareTransactionUI {...props} />,
    },
  });
}

/**
 *
 */
export async function renderDisplayPrivateKeyConfirmUI(): Promise<DialogResult> {
  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: <DisplayPrivateKeyDialogUI />,
    },
  });
}

/**
 *
 * @param privateKey
 */
export async function renderDisplayPrivateKeyAlertUI(
  privateKey: string,
): Promise<void> {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Alert,
      content: <DisplayPrivateKeyAlertUI privateKey={privateKey} />,
    },
  });
}

/**
 *
 * @param options0
 * @param options0.children
 */
export async function alertDialog({ children }) {
  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Alert,
      content: children,
    },
  });
}

/**
 *
 * @param options0
 * @param options0.children
 */
export async function confirmDialog({ children }) {
  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: children,
    },
  });
}

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
