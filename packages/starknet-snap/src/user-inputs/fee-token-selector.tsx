import type {
  InputChangeEvent,
  InterfaceContext,
  UserInputEvent,
} from '@metamask/snaps-sdk';
import type { Call, EstimateFee } from 'starknet';
import { constants, TransactionType } from 'starknet';

import type { FeeTokenUnit } from '../types/snapApi';
import { FeeToken } from '../types/snapApi';
import type { TransactionRequest } from '../types/snapState';
import type { ExecuteTxnUIProps } from '../ui/components';
import { ExecuteTxnUI } from '../ui/components';
import { updateFlow } from '../ui/utils';
import { getEstimatedFees } from '../utils/starknetUtils';
import { AccountUserInputController } from '../utils/user-input';
import { hasSufficientFunds } from './utils';

/**
 * Controller for handling fee token selection in user interactions.
 * Extends `AccountUserInputController` to provide functionality specific to
 * selecting and validating fee tokens for transactions.
 */
export class FeeTokenSelectorController extends AccountUserInputController {
  /**
   * Retrieves the estimated fees for the provided calls and fee token.
   * @param signer - The signer of the transaction.
   * @param calls - The list of contract calls for the transaction.
   * @param feeToken - The selected fee token (e.g., STRK or ETH).
   * @returns An object containing fee details such as suggested max fee, overall fee, and estimate results.
   */
  protected async getFees(
    signer: string,
    calls: Call[],
    feeToken: FeeToken,
  ): Promise<{
    suggestedMaxFee: string;
    overallFee: string;
    unit: FeeTokenUnit;
    includeDeploy: boolean;
    estimateResults: EstimateFee[];
  }> {
    return await getEstimatedFees(
      this.network,
      signer,
      this.account.privateKey,
      this.account.publicKey,
      [{ type: TransactionType.INVOKE, payload: calls }],
      {
        version:
          feeToken === FeeToken.STRK
            ? constants.TRANSACTION_VERSION.V3
            : undefined,
      },
    );
  }

  async getSigner(
    _id: string,
    _event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<string> {
    const request = context?.request as TransactionRequest;
    if (request?.signer) {
      return request?.signer;
    }
    throw new Error('No signer found in stored request state');
  }

  /**
   * Handles user input to select and validate fee tokens for a transaction.
   * Updates the transaction request state and user interface accordingly.
   * @param id - The unique identifier for the interface.
   * @param event - The user input event containing the selected fee token.
   * @param context - Additional context from the interface.
   * @returns A promise that resolves when user input handling is complete.
   */
  protected async handleUserInput(
    id: string,
    event: InputChangeEvent,
    context: InterfaceContext | null,
  ): Promise<void> {
    let request: TransactionRequest | null = null;
    try {
      const feeToken = event.value as FeeToken;
      if (context) {
        request = context?.request as TransactionRequest;
        if (request?.calls) {
          const { includeDeploy, suggestedMaxFee, estimateResults } =
            await this.getFees(
              request.signer,
              request.calls.map((call) => ({
                calldata: call.calldata,
                contractAddress: call.contractAddress,
                entrypoint: call.entrypoint,
              })),
              feeToken,
            );
          const sufficientFunds = await hasSufficientFunds(
            request.signer,
            this.network,
            request.calls,
            feeToken,
            suggestedMaxFee,
          );
          if (!sufficientFunds) {
            throw new Error('Not enough funds to pay for fee');
          }
          request.maxFee = suggestedMaxFee;
          request.selectedFeeToken = feeToken;
          request.includeDeploy = includeDeploy;
          request.resourceBounds = estimateResults.map(
            (result) => result.resourceBounds,
          );

          await updateFlow(id, ExecuteTxnUI, request);
        }
      }
    } catch (error) {
      const errorMessage =
        error.message === 'Not enough funds to pay for fee'
          ? 'Not enough funds to pay for fee'
          : 'Error calculating fees';
      // On failure, display ExecuteTxnUI with an error message
      if (request) {
        await updateFlow<ExecuteTxnUIProps>(id, ExecuteTxnUI, request, {
          errors: { fees: errorMessage },
        });
      } else {
        throw error;
      }
    }
  }
}

// Singleton instance for reuse
export const feeTokenSelectorController = new FeeTokenSelectorController();
