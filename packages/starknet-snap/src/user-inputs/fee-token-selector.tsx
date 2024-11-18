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
import type { ExecuteTxnUIProps } from '../ui/components';
import { ExecuteTxnUI } from '../ui/components';
import { updateFlow } from '../ui/utils';
import { getEstimatedFees } from '../utils/starknetUtils';
import { AccountUserInputController } from '../utils/user-input';
import { hasSufficientFunds } from './utils';

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

          await this.stateManager.upsertTransactionRequest(request);

          await updateFlow(ExecuteTxnUI, request);
        }
      }
    } catch (error) {
      const errorMessage =
        error.message === 'Not enough funds to pay for fee'
          ? 'Not enough funds to pay for fee'
          : 'Error calculating fees';
      // On failure, display ExecuteTxnUI with an error message
      if (request) {
        await updateFlow<ExecuteTxnUIProps>(ExecuteTxnUI, request, {
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
