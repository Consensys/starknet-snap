import type { DialogResult } from '@metamask/snaps-sdk';
import { DialogType } from '@metamask/snaps-sdk';

import type {
  FormattedCallData,
  Network,
  TransactionRequest,
} from '../types/snapState';
import {
  BlockIdentifierEnum,
  DEFAULT_DECIMAL_PLACES,
} from '../utils/constants';
import { getBalance } from '../utils/starknetUtils';
import type { ExecuteTxnUIErrors } from './components';
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
import { LoadingUI } from './fragments/LoadingUI';
import type { TokenTotals } from './types';

/**
 * Renders a confirmation dialog for adding a token to the wallet.
 *
 * @param props - The properties for the WatchAssetUI component.
 * @returns A promise that resolves to the user's decision in the dialog.
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
 * Renders a confirmation dialog for switching to a different network.
 *
 * @param props - The properties for the SwitchNetworkUI component.
 * @returns A promise that resolves to the user's decision in the dialog.
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
 * Renders a confirmation dialog for signing a transaction.
 *
 * @param props - The properties for the SignTransactionUI component.
 * @returns A promise that resolves to the user's decision in the dialog.
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
 * Renders a confirmation dialog for signing a message.
 *
 * @param props - The properties for the SignMessageUI component.
 * @returns A promise that resolves to the user's decision in the dialog.
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
 * Renders a confirmation dialog for signing a Declare transaction.
 *
 * @param props - The properties for the SignDeclareTransactionUI component.
 * @returns A promise that resolves to the user's decision in the dialog.
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
 * Renders a confirmation dialog asking the user to confirm displaying their private key.
 *
 * @returns A promise that resolves to the user's decision in the dialog.
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
 * Renders an alert dialog displaying the user's private key securely.
 *
 * @param privateKey - The private key to display in the alert dialog.
 * @returns A promise that resolves when the dialog is dismissed.
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
 * Generate the interface for a ExecuteTxnUI.
 *
 * @param request - The `TransactionRequest` object.
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
 * Update the interface for the ExecuteTxnUI.
 *
 * @param id - The Interface Id to update.
 * @param request - The `TransactionRequest` object.
 * @param [errors] - Optional partial props for error handling or overrides.
 * @param [errors.errors] - The error object for the ExecuteTxnUI.
 */
export async function updateExecuteTxnFlow(
  id: string,
  request: TransactionRequest,
  errors?: { errors: ExecuteTxnUIErrors },
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

/**
 * Update the interface with the provided JSX.
 *
 * @param id - The Interface Id to update.
 * @param ui - The JSX element to update the interface with.
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

/**
 * Render a loading interface.
 *
 * @param id - The Interface Id to update.
 */
export async function renderLoading(id: string): Promise<void> {
  await updateInterface(id, <LoadingUI />);
}

/**
 * Verify if the fee token balance covers both the calls and fee.
 *
 * @param params - The parameters for the function.
 * @param params.feeTokenAddress - The address of the fee token.
 * @param params.suggestedMaxFee - The suggested maximum fee.
 * @param params.network - The `Network` object.
 * @param params.address - The address to check the balance for.
 * @param params.calls - The array of `FormattedCallData` objects.
 * @returns A Promise that resolves to a boolean indicating if the balance is sufficient.
 */
export async function hasSufficientFundsForFee({
  feeTokenAddress,
  suggestedMaxFee,
  network,
  address,
  calls,
}: {
  feeTokenAddress: string;
  suggestedMaxFee: string;
  network: Network;
  address: string;
  calls: FormattedCallData[];
}) {
  const balanceForFeeToken = BigInt(
    await getBalance(
      address,
      feeTokenAddress,
      network,
      BlockIdentifierEnum.Pending,
    ),
  );

  // Calculate total STRK or ETH amounts from `calls`
  const totalSpendForFeeToken = calls.reduce((acc, call) => {
    const { tokenTransferData, contractAddress } = call;
    if (tokenTransferData && contractAddress === feeTokenAddress) {
      return acc + BigInt(tokenTransferData.amount); // Return the updated accumulator
    }
    return acc; // Return the current accumulator if the condition is not met
  }, BigInt(suggestedMaxFee)); // Initial value

  return totalSpendForFeeToken <= balanceForFeeToken;
}
