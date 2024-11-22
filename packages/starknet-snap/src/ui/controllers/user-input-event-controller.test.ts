import type { InterfaceContext, UserInputEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { constants, ec, num as numUtils, TransactionType } from 'starknet';

import type { StarknetAccount } from '../../__tests__/helper';
import {
  generateAccounts,
  generateTransactionRequests,
  generateEstimateFeesResponse,
} from '../../__tests__/helper';
import { NetworkStateManager } from '../../state/network-state-manager';
import { TransactionRequestStateManager } from '../../state/request-state-manager';
import { TokenStateManager } from '../../state/token-state-manager';
import { FeeToken, FeeTokenUnit } from '../../types/snapApi';
import type { Erc20Token, TransactionRequest } from '../../types/snapState';
import {
  ETHER_SEPOLIA_TESTNET,
  STARKNET_TESTNET_NETWORK,
  STRK_SEPOLIA_TESTNET,
} from '../../utils/constants';
import * as keyPairUtils from '../../utils/keyPair';
import * as StarknetUtils from '../../utils/starknetUtils';
import * as UiUtils from '../utils';
import { UserInputEventController } from './user-input-event-controller';

jest.mock('../../utils/logger');

class MockUserInputEventController extends UserInputEventController {
  async deriveAccount(index: number) {
    return super.deriveAccount(index);
  }

  feeTokenToTransactionVersion(feeToken: FeeToken) {
    return super.feeTokenToTransactionVersion(feeToken);
  }

  async getTokenAddress(chainId: string, feeToken: FeeToken) {
    return super.getTokenAddress(chainId, feeToken);
  }

  async getNetwork(chainId: string) {
    return super.getNetwork(chainId);
  }

  async handleFeeTokenChange() {
    return super.handleFeeTokenChange();
  }
}

describe('UserInputEventController', () => {
  const createMockController = ({
    eventId = 'mock-event-id',
    event = {} as UserInputEvent,
    context = {} as InterfaceContext,
  }: {
    eventId?: string;
    event?: UserInputEvent;
    context?: InterfaceContext;
  }) => {
    return new MockUserInputEventController(eventId, event, context);
  };

  const mockKeyPairUtils = ({ addressKey, index }) => {
    const getAddressKeySpy = jest.spyOn(keyPairUtils, 'getAddressKey');
    getAddressKeySpy.mockResolvedValue({
      addressKey,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      derivationPath: `m / bip32:${9004}' / bip32:${0}' / bip32:${0}' / bip32:${index}'`,
    });
    return {
      getAddressKeySpy,
    };
  };

  const mockNetworkStateManager = (network) => {
    const getNetworkSpy = jest.spyOn(
      NetworkStateManager.prototype,
      'getNetwork',
    );
    getNetworkSpy.mockResolvedValue(network);
    return {
      getNetworkSpy,
    };
  };

  const mockTokenStateManager = () => {
    const getEthTokenSpy = jest.spyOn(
      TokenStateManager.prototype,
      'getEthToken',
    );
    const getStrkTokenSpy = jest.spyOn(
      TokenStateManager.prototype,
      'getStrkToken',
    );
    getStrkTokenSpy.mockResolvedValue(STRK_SEPOLIA_TESTNET);
    getEthTokenSpy.mockResolvedValue(ETHER_SEPOLIA_TESTNET);

    return {
      getEthTokenSpy,
      getStrkTokenSpy,
    };
  };

  const mockTransactionRequestStateManager = (
    transactionRequest: TransactionRequest | null,
  ) => {
    const getTransactionRequestSpy = jest.spyOn(
      TransactionRequestStateManager.prototype,
      'getTransactionRequest',
    );
    const upsertTransactionRequestSpy = jest.spyOn(
      TransactionRequestStateManager.prototype,
      'upsertTransactionRequest',
    );

    getTransactionRequestSpy.mockResolvedValue(transactionRequest);

    return {
      getTransactionRequestSpy,
      upsertTransactionRequestSpy,
    };
  };

  const generateTransactionRequest = async ({
    chainId,
    account,
  }: {
    chainId: string;
    account?: StarknetAccount;
  }) => {
    const address = account
      ? account.address
      : (await generateAccounts(chainId, 1))[0].address;

    const [transactionRequest] = generateTransactionRequests({
      chainId,
      address,
    });

    return transactionRequest;
  };

  const generateEvent = ({
    transactionRequest,
    eventValue = FeeToken.ETH,
    eventType = UserInputEventType.InputChangeEvent,
    eventName = 'feeTokenSelector',
  }: {
    transactionRequest: TransactionRequest;
    eventValue?: string;
    eventType?: UserInputEventType;
    eventName?: string;
  }) => {
    return {
      event: {
        name: eventName,
        type: eventType,
        value: eventValue,
      } as unknown as UserInputEvent,
      context: {
        request: transactionRequest,
      },
    };
  };

  describe('deriveAccount', () => {
    it('returns the privateKey and Public of the derived account', async () => {
      const { chainId } = STARKNET_TESTNET_NETWORK;
      const [account] = await generateAccounts(chainId, 1);

      const addressKey = account.privateKey;
      mockKeyPairUtils({ addressKey, index: 0 });

      const publicKey = ec.starkCurve.getStarkKey(addressKey);
      const privateKey = numUtils.toHex(addressKey);

      const controller = createMockController({});
      const result = await controller.deriveAccount(0);
      expect(result).toStrictEqual({ publicKey, privateKey });
    });
  });

  describe('feeTokenToTransactionVersion', () => {
    it.each([
      {
        feeToken: FeeToken.STRK,
        transactionVersion: constants.TRANSACTION_VERSION.V3,
      },
      {
        feeToken: FeeToken.ETH,
        transactionVersion: undefined,
      },
    ])(
      'returns transaction version $transactionVersion if the fee token is $feeToken',
      ({ feeToken, transactionVersion }) => {
        const controller = createMockController({});
        expect(controller.feeTokenToTransactionVersion(feeToken)).toStrictEqual(
          transactionVersion,
        );
      },
    );
  });

  describe('getTokenAddress', () => {
    it.each([
      {
        feeToken: FeeToken.STRK,
        token: STRK_SEPOLIA_TESTNET,
      },
      {
        feeToken: FeeToken.ETH,
        token: ETHER_SEPOLIA_TESTNET,
      },
      {
        feeToken: undefined,
        token: ETHER_SEPOLIA_TESTNET,
      },
    ])(
      'returns the $token.name address for the fee token is $feeToken',
      async ({ feeToken, token }) => {
        const { chainId } = STARKNET_TESTNET_NETWORK;
        mockTokenStateManager();

        const controller = createMockController({});
        // feeToken could be undefined, so we have to force to cast it as FeeToken
        const result = await controller.getTokenAddress(
          chainId,
          feeToken as unknown as FeeToken,
        );

        expect(result).toStrictEqual(token.address);
      },
    );

    it('throws `Token not found` error if the token is not found', async () => {
      const { chainId } = STARKNET_TESTNET_NETWORK;
      const { getEthTokenSpy } = mockTokenStateManager();
      getEthTokenSpy.mockResolvedValue(null);

      const controller = createMockController({});
      await expect(
        controller.getTokenAddress(chainId, FeeToken.ETH),
      ).rejects.toThrow('Token not found');
    });
  });

  describe('getNetwork', () => {
    it('returns the network with the given chainId', async () => {
      const network = STARKNET_TESTNET_NETWORK;
      mockNetworkStateManager(network);

      const controller = createMockController({});
      const result = await controller.getNetwork(network.chainId);

      expect(result).toStrictEqual(network);
    });

    it('throws `Network not found` error if the network is not found', async () => {
      const network = STARKNET_TESTNET_NETWORK;
      const { getNetworkSpy } = mockNetworkStateManager(network);
      getNetworkSpy.mockResolvedValue(null);

      const controller = createMockController({});
      await expect(controller.getNetwork(network.chainId)).rejects.toThrow(
        'Network not found',
      );
    });
  });

  describe('handleEvent', () => {
    const mockHandleFeeTokenChange = () => {
      const handleFeeTokenChangeSpy = jest.spyOn(
        MockUserInputEventController.prototype,
        'handleFeeTokenChange',
      );
      handleFeeTokenChangeSpy.mockReturnThis();
      return {
        handleFeeTokenChangeSpy,
      };
    };

    const prepareHandleEvent = async () => {
      const { chainId } = STARKNET_TESTNET_NETWORK;
      const transactionRequest = await generateTransactionRequest({ chainId });
      const event = generateEvent({
        transactionRequest,
        eventValue: FeeToken.STRK,
      });
      const { getTransactionRequestSpy } =
        mockTransactionRequestStateManager(transactionRequest);
      const { handleFeeTokenChangeSpy } = mockHandleFeeTokenChange();

      const controller = createMockController(event);

      return {
        controller,
        getTransactionRequestSpy,
        handleFeeTokenChangeSpy,
        transactionRequest,
        event,
      };
    };

    it('calls `handleFeeTokenChange` if the event key is `FeeTokenSelectorEventKey.FeeTokenChange`', async () => {
      const {
        controller,
        getTransactionRequestSpy,
        handleFeeTokenChangeSpy,
        transactionRequest,
      } = await prepareHandleEvent();
      await controller.handleEvent();

      expect(getTransactionRequestSpy).toHaveBeenCalledWith({
        requestId: transactionRequest.id,
      });
      expect(handleFeeTokenChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('throws `Transaction request not found` error if the transaction request not found', async () => {
      const { controller, getTransactionRequestSpy } =
        await prepareHandleEvent();
      getTransactionRequestSpy.mockResolvedValue(null);

      await expect(controller.handleEvent()).rejects.toThrow(
        'Transaction request not found',
      );
    });

    it.each([undefined, 'other-event'])(
      'does nothing if the event key is not `FeeTokenSelectorEventKey.FeeTokenChange` -  event name: %s',
      async (eventName) => {
        const { handleFeeTokenChangeSpy, event } = await prepareHandleEvent();

        event.event.name = eventName;
        const controller = createMockController(event);
        await controller.handleEvent();

        expect(handleFeeTokenChangeSpy).toHaveBeenCalledTimes(0);
      },
    );
  });

  describe('handleFeeTokenChange', () => {
    const mockDeriveAccount = (account: StarknetAccount) => {
      const deriveAccountSpy = jest.spyOn(
        MockUserInputEventController.prototype,
        'deriveAccount',
      );
      deriveAccountSpy.mockResolvedValue({
        publicKey: account.publicKey,
        privateKey: account.privateKey,
      });
      return {
        deriveAccountSpy,
      };
    };

    const mockEstimateFee = (feeToken: FeeToken) => {
      const getEstimatedFeesSpy = jest.spyOn(StarknetUtils, 'getEstimatedFees');
      const mockEstimateFeeResponse = generateEstimateFeesResponse();
      const concatedFee = StarknetUtils.addFeesFromAllTransactions(
        mockEstimateFeeResponse,
      );

      const mockGetEstimatedFeesResponse = {
        suggestedMaxFee: concatedFee.suggestedMaxFee.toString(10),
        overallFee: concatedFee.overall_fee.toString(10),
        unit: FeeTokenUnit[feeToken],
        includeDeploy: true,
        estimateResults: mockEstimateFeeResponse,
      };

      getEstimatedFeesSpy.mockResolvedValue(mockGetEstimatedFeesResponse);

      return {
        getEstimatedFeesSpy,
        mockGetEstimatedFeesResponse,
      };
    };

    const mockUpdateExecuteTxnFlow = () => {
      const updateExecuteTxnFlowSpy = jest.spyOn(
        UiUtils,
        'updateExecuteTxnFlow',
      );
      updateExecuteTxnFlowSpy.mockReturnThis();
      return {
        updateExecuteTxnFlowSpy,
      };
    };

    const mockHasSufficientFundsForFee = (result = true) => {
      const hasSufficientFundsForFeeSpy = jest.spyOn(
        UiUtils,
        'hasSufficientFundsForFee',
      );
      hasSufficientFundsForFeeSpy.mockResolvedValue(result);

      return {
        hasSufficientFundsForFeeSpy,
      };
    };

    const prepareHandleFeeTokenChange = async (
      feeToken: FeeToken = FeeToken.STRK,
    ) => {
      const network = STARKNET_TESTNET_NETWORK;
      const { chainId } = network;

      const [account] = await generateAccounts(chainId, 1);

      const transactionRequest = await generateTransactionRequest({
        chainId,
        account,
      });
      const event = generateEvent({ transactionRequest, eventValue: feeToken });

      mockNetworkStateManager(network);
      mockDeriveAccount(account);
      mockTokenStateManager();

      return {
        ...mockHasSufficientFundsForFee(),
        ...mockUpdateExecuteTxnFlow(),
        ...mockEstimateFee(feeToken),
        ...mockTransactionRequestStateManager(null),
        event,
        transactionRequest,
        account,
        network,
        feeToken,
      };
    };

    it.each([STRK_SEPOLIA_TESTNET, ETHER_SEPOLIA_TESTNET])(
      'updates the transaction request with the updated estimated fee: feeToken - %symbol',
      async (token: Erc20Token) => {
        const feeToken = FeeToken[token.symbol];
        const {
          event,
          account,
          network,
          getEstimatedFeesSpy,
          hasSufficientFundsForFeeSpy,
          updateExecuteTxnFlowSpy,
          mockGetEstimatedFeesResponse,
          upsertTransactionRequestSpy,
          transactionRequest,
        } = await prepareHandleFeeTokenChange(feeToken);
        const feeTokenAddress = token.address;
        const { signer, calls } = transactionRequest;
        const { publicKey, privateKey, address } = account;
        const { suggestedMaxFee } = mockGetEstimatedFeesResponse;

        const controller = createMockController(event);
        await controller.handleFeeTokenChange();

        expect(getEstimatedFeesSpy).toHaveBeenCalledWith(
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
            version: controller.feeTokenToTransactionVersion(feeToken),
          },
        );
        expect(hasSufficientFundsForFeeSpy).toHaveBeenCalledWith({
          address,
          network,
          calls,
          feeTokenAddress,
          suggestedMaxFee,
        });
        // transactionRequest will be pass by reference, so we can use this to check the updated value
        expect(transactionRequest.maxFee).toStrictEqual(suggestedMaxFee);
        expect(updateExecuteTxnFlowSpy).toHaveBeenCalledWith(
          controller.eventId,
          transactionRequest,
        );
        expect(upsertTransactionRequestSpy).toHaveBeenCalledWith(
          transactionRequest,
        );
      },
    );

    it('updates the transaction request with an insufficient funds error message if the account balance is insufficient to cover the fee.', async () => {
      const {
        event,
        hasSufficientFundsForFeeSpy,
        transactionRequest,
        updateExecuteTxnFlowSpy,
        upsertTransactionRequestSpy,
        feeToken,
      } = await prepareHandleFeeTokenChange();
      hasSufficientFundsForFeeSpy.mockResolvedValue(false);

      const controller = createMockController(event);
      await controller.handleFeeTokenChange();

      expect(upsertTransactionRequestSpy).not.toHaveBeenCalled();
      expect(updateExecuteTxnFlowSpy).toHaveBeenCalledWith(
        controller.eventId,
        transactionRequest,
        {
          errors: {
            fees: `Not enough ${feeToken} to pay for fee`,
          },
        },
      );
    });

    it('updates the transaction request with an general error message if other error was thrown.', async () => {
      const {
        event,
        hasSufficientFundsForFeeSpy,
        transactionRequest,
        updateExecuteTxnFlowSpy,
        upsertTransactionRequestSpy,
      } = await prepareHandleFeeTokenChange();
      // Simulate an error thrown to test the error handling
      hasSufficientFundsForFeeSpy.mockRejectedValue(false);

      const controller = createMockController(event);
      await controller.handleFeeTokenChange();

      expect(upsertTransactionRequestSpy).not.toHaveBeenCalled();
      expect(updateExecuteTxnFlowSpy).toHaveBeenCalledWith(
        controller.eventId,
        transactionRequest,
        {
          errors: {
            fees: `Fail to calculate the fees`,
          },
        },
      );
    });
  });
});
