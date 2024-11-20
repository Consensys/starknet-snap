import type {
  InputChangeEvent,
  InterfaceContext,
  UserInputEvent,
} from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { constants, ec, num as numUtils, TransactionType } from 'starknet';

import { NetworkStateManager } from '../../state/network-state-manager';
import { TransactionRequestStateManager } from '../../state/request-state-manager';
import { FeeToken } from '../../types/snapApi';
import type { Network, TransactionRequest } from '../../types/snapState';
import { getBip44Deriver, logger } from '../../utils';
import { getAddressKey } from '../../utils/keyPair';
import { getEstimatedFees } from '../../utils/starknetUtils';
import {
  hasSufficientFunds,
  renderLoading,
  updateExecuteTxnFlow,
  updateInterface,
} from '../utils';

export enum FeeTokenSelectorEventKey {
  FeeTokenChange = `feeTokenSelector_${UserInputEventType.InputChangeEvent}`,
}

export class UserInputEventController {
  context: InterfaceContext | null;

  event: UserInputEvent;

  eventId: string;

  reqStateMgr: TransactionRequestStateManager;

  networkStateMgr: NetworkStateManager;

  constructor(
    eventId: string,
    event: UserInputEvent,
    context: InterfaceContext | null,
  ) {
    this.event = event;
    this.context = context;
    this.eventId = eventId;
    this.reqStateMgr = new TransactionRequestStateManager();
    this.networkStateMgr = new NetworkStateManager();
  }

  async handleEvent() {
    try {
      const request = this.context?.request as TransactionRequest;

      if (
        !(await this.reqStateMgr.getTransactionRequest({
          requestId: request.id,
        }))
      ) {
        throw new Error('Transaction request not found');
      }

      await renderLoading(this.eventId);

      const eventKey = `${this.event.name}_${this.event.type}`;

      switch (eventKey) {
        case FeeTokenSelectorEventKey.FeeTokenChange:
          await this.handleFeeTokenChange();
          break;
        default:
          break;
      }
    } catch (error) {
      logger.error('onUserInput error:', error);
      throw error;
    }
  }

  protected async deriveAccount(index: number) {
    const deriver = await getBip44Deriver();
    const { addressKey } = await getAddressKey(deriver, index);
    const publicKey = ec.starkCurve.getStarkKey(addressKey);
    const privateKey = numUtils.toHex(addressKey);
    return {
      publicKey,
      privateKey,
    };
  }

  protected feeTokenToTransactionVersion(feeToken: FeeToken) {
    return feeToken === FeeToken.STRK
      ? constants.TRANSACTION_VERSION.V3
      : undefined;
  }

  protected async getNetwork(chainId: string): Promise<Network> {
    const network = await this.networkStateMgr.getNetwork({ chainId });

    if (!network) {
      throw new Error('Network not found');
    }

    return network;
  }

  protected async handleFeeTokenChange() {
    const request = this.context?.request as TransactionRequest;
    const { addressIndex, calls, signer, chainId } = request;

    try {
      const network = await this.getNetwork(chainId);

      const feeToken = (this.event as InputChangeEvent)
        .value as unknown as FeeToken;

      const { publicKey, privateKey } = await this.deriveAccount(addressIndex);

      const requestTxnVersion = this.feeTokenToTransactionVersion(feeToken);

      const { includeDeploy, suggestedMaxFee, estimateResults } =
        await getEstimatedFees(
          network,
          signer,
          privateKey,
          publicKey,
          [
            {
              type: TransactionType.INVOKE,
              payload: calls.map((call) => ({
                calldata: call.calldata,
                contractAddress: call.contractAddress,
                entrypoint: call.entrypoint,
              })),
            },
          ],
          {
            version: requestTxnVersion,
          },
        );

      const sufficientFunds = await hasSufficientFunds(
        signer,
        network,
        calls,
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

      await updateExecuteTxnFlow(this.eventId, request);
      await this.reqStateMgr.upsertTransactionRequest(request);
    } catch (error) {
      const errorMessage =
        error.message === 'Not enough funds to pay for fee'
          ? 'Not enough funds to pay for fee'
          : 'Error calculating fees';
      // On failure, display ExecuteTxnUI with an error message

      await updateExecuteTxnFlow(this.eventId, request, {
        errors: { fees: errorMessage },
      });
    }
  }
}
