import type {
  InputChangeEvent,
  InterfaceContext,
  UserInputEvent,
} from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { constants, ec, num as numUtils, TransactionType } from 'starknet';

import { NetworkStateManager } from '../../state/network-state-manager';
import { TransactionRequestStateManager } from '../../state/request-state-manager';
import { TokenStateManager } from '../../state/token-state-manager';
import { FeeToken } from '../../types/snapApi';
import type { Network, TransactionRequest } from '../../types/snapState';
import { getBip44Deriver, logger } from '../../utils';
import { InsufficientFundsError } from '../../utils/exceptions';
import { getAddressKey } from '../../utils/keyPair';
import { getEstimatedFees } from '../../utils/starknetUtils';
import {
  hasSufficientFundsForFee,
  renderLoading,
  updateExecuteTxnFlow,
} from '../utils';

const FeeTokenSelectorEventKey = {
  FeeTokenChange: `feeTokenSelector_${UserInputEventType.InputChangeEvent}`,
} as const;

type FeeTokenSelectorEventKey =
  (typeof FeeTokenSelectorEventKey)[keyof typeof FeeTokenSelectorEventKey];

export class UserInputEventController {
  context: InterfaceContext | null;

  event: UserInputEvent;

  eventId: string;

  reqStateMgr: TransactionRequestStateManager;

  networkStateMgr: NetworkStateManager;

  tokenStateMgr: TokenStateManager;

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
    this.tokenStateMgr = new TokenStateManager();
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

      const eventKey = `${this.event.name ?? ''}_${this.event.type}`;

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

  protected async getTokenAddress(
    chainId: string,
    feeToken: FeeToken,
  ): Promise<string> {
    const token =
      feeToken === FeeToken.STRK
        ? await this.tokenStateMgr.getStrkToken({
            chainId,
          })
        : await this.tokenStateMgr.getEthToken({
            chainId,
          });

    if (!token) {
      throw new Error('Token not found');
    }

    return token.address;
  }

  protected async handleFeeTokenChange() {
    const request = this.context?.request as TransactionRequest;
    const { addressIndex, calls, signer, chainId } = request;
    const feeToken = (this.event as InputChangeEvent)
      .value as unknown as FeeToken;

    try {
      const network = await this.getNetwork(chainId);

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

      if (
        !(await hasSufficientFundsForFee({
          address: signer,
          network,
          calls,
          feeTokenAddress: await this.getTokenAddress(
            network.chainId,
            feeToken,
          ),
          suggestedMaxFee,
        }))
      ) {
        throw new InsufficientFundsError();
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
        error instanceof InsufficientFundsError
          ? `Not enough ${feeToken} to pay for fee`
          : 'Fail to calculate the fees';

      // On failure, display ExecuteTxnUI with an error message
      await updateExecuteTxnFlow(this.eventId, request, {
        errors: { fees: errorMessage },
      });
    }
  }
}
