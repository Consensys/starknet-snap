import type { InputChangeEvent, InterfaceContext } from '@metamask/snaps-sdk';
import { constants, TransactionType } from 'starknet';

import { TransactionRequestStateManager } from '../state/request-state-manager';
import { FeeToken } from '../types/snapApi';
import { ExecuteTxnUI } from '../ui/components';
import { getEstimatedFees } from '../utils/starknetUtils';
import { AccountUserInputController } from '../utils/user-input';

export class FeeTokenSelectorController extends AccountUserInputController {
  protected async handleUserInput(
    id: string,
    event: InputChangeEvent,
    context: InterfaceContext | null,
  ): Promise<void> {
    const stateManager = new TransactionRequestStateManager();
    try {
      const feeToken = event.value as FeeToken;
      if (context) {
        const request = await stateManager.getTransactionRequest({
          requestId: context.id as string,
          interfaceId: id,
        });

        if (request?.signer && request.calls) {
          // Use setupAccount to initialize network and account
          await this.setupAccount(request.signer);

          const { includeDeploy, suggestedMaxFee, estimateResults } =
            await getEstimatedFees(
              this.network,
              request.signer,
              this.account.privateKey,
              this.account.publicKey,
              [{ type: TransactionType.INVOKE, payload: request.calls }],
              {
                version:
                  feeToken === FeeToken.STRK
                    ? constants.TRANSACTION_VERSION.V3
                    : undefined,
              },
            );

          request.maxFee = suggestedMaxFee;
          request.feeToken = feeToken;
          request.includeDeploy = includeDeploy;
          request.resourceBounds = estimateResults.map(
            (result) => result.resourceBounds,
          );

          await stateManager.upsertTransactionRequest(request);

          // Update UI
          await snap.request({
            method: 'snap_updateInterface',
            params: {
              id,
              ui: (
                <ExecuteTxnUI
                  type={request.type}
                  signer={request.signer}
                  chainId={request.chainId}
                  maxFee={request.maxFee}
                  calls={request.calls}
                  feeToken={feeToken}
                  includeDeploy={includeDeploy}
                />
              ),
            },
          });
        }
      }
    } catch (error) {
      await stateManager.removeTransactionRequest(context?.id as string);
      throw error;
    }
  }
}

// Singleton instance for reuse
export const feeTokenSelectorController = new FeeTokenSelectorController();
