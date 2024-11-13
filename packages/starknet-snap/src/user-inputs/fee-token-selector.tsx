import type {
  InputChangeEvent,
  InterfaceContext,
  UserInputEvent,
} from '@metamask/snaps-sdk';
import type { Call, EstimateFee } from 'starknet';
import { constants, TransactionType } from 'starknet';

import { TransactionRequestStateManager } from '../state/request-state-manager';
import type { FeeTokenUnit } from '../types/snapApi';
import { FeeToken } from '../types/snapApi';
import type { TransactionRequest } from '../types/snapState';
import { updateExecuteTxnFlow } from '../ui/utils';
import { getEstimatedFees, hasSufficientFunds } from '../utils/starknetUtils';
import { AccountUserInputController } from '../utils/user-input';

export class FeeTokenSelectorController extends AccountUserInputController {
  protected stateManager: TransactionRequestStateManager;

  constructor() {
    super();
    this.stateManager = new TransactionRequestStateManager();
  }

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
    id: string,
    _event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<string> {
    const request = await this.stateManager.getTransactionRequest({
      requestId: context?.id as string,
      interfaceId: id,
    });
    if (request?.signer) {
      return request?.signer;
    }
    throw new Error('No signer found in stored request state');
  }

  protected async handleUserInput(
    id: string,
    event: InputChangeEvent,
    context: InterfaceContext | null,
  ): Promise<void> {
    let request: TransactionRequest | null = null;
    try {
      const feeToken = event.value as FeeToken;
      if (context) {
        request = await this.stateManager.getTransactionRequest({
          requestId: context.id as string,
          interfaceId: id,
        });

        if (request?.calls) {
          const { includeDeploy, suggestedMaxFee, estimateResults } =
            await this.getFees(this.account.publicKey, request.calls, feeToken);

          const sufficientFunds = await hasSufficientFunds(
            this.account.publicKey,
            this.network,
            request.calls,
            feeToken,
            suggestedMaxFee,
          );

          if (!sufficientFunds) {
            throw new Error('Not enough funds to pay for fee');
          }

          request.maxFee = suggestedMaxFee;
          request.feeToken = feeToken;
          request.includeDeploy = includeDeploy;
          request.resourceBounds = estimateResults.map(
            (result) => result.resourceBounds,
          );

          await this.stateManager.upsertTransactionRequest(request);

          await updateExecuteTxnFlow(request);
        }
      }
    } catch (error) {
      const errorMessage =
        error.message === 'Not enough funds to pay for fee'
          ? 'Not enough funds to pay for fee'
          : 'Error calculating fees';
      // On failure, display ExecuteTxnUI with an error message
      if (request) {
        await updateExecuteTxnFlow(request, { fees: errorMessage });
      } else {
        throw error;
      }
    }
  }
}

// Singleton instance for reuse
export const feeTokenSelectorController = new FeeTokenSelectorController();
