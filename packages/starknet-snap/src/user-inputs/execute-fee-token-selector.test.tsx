import type { InterfaceContext, UserInputEvent } from '@metamask/snaps-sdk';
import { constants } from 'starknet';

import {
  generateTransactionRequests,
  getEstimateFees,
} from '../__tests__/helper';
import { mockAccount, prepareMockAccount } from '../rpcs/__tests__/helper';
import { TransactionRequestStateManager } from '../state/request-state-manager';
import type { SnapState } from '../types/snapState';
import { ExecuteTxnUI } from '../ui/components';
import * as uiUtils from '../ui/utils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { executeFeeTokenSelectorController } from './execute-fee-token-selector';
import * as userInputUtils from './utils';

jest.mock('../state/token-state-manager');
jest.mock('../state/request-state-manager');
jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('fee-token-selector', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  const getChainId = () => constants.StarknetChainId.SN_SEPOLIA;

  const prepareMockData = async () => {
    const id = 'test-id';
    const event = { name: 'test-event', value: 'test-value' } as UserInputEvent;
    const context = { data: 'test-context' } as InterfaceContext;
    const chainId = getChainId();
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
    prepareMockAccount(account, state);

    const updateFlow = jest.spyOn(uiUtils, 'updateFlow');

    const getTransactionRequestSpy = jest.spyOn(
      TransactionRequestStateManager.prototype,
      'getRequest',
    );

    const upsertTransactionRequestSpy = jest.spyOn(
      TransactionRequestStateManager.prototype,
      'upsertRequest',
    );

    const handleUserInputSpy = jest.spyOn(
      executeFeeTokenSelectorController as any,
      'handleUserInput',
    );
    const getFeesSpy = jest.spyOn(
      executeFeeTokenSelectorController as any,
      'getFees',
    );
    const hasSufficientFundsSpy = jest.spyOn(
      userInputUtils as any,
      'hasSufficientFunds',
    );

    const transactionRequests = generateTransactionRequests({
      chainId,
      address: account.address,
      cnt: 10,
    });

    return {
      id,
      event,
      context,
      handleUserInputSpy,
      updateFlow,
      transactionRequests,
      getFeesSpy,
      hasSufficientFundsSpy,
      getTransactionRequestSpy,
      upsertTransactionRequestSpy,
    };
  };

  it('updates dialog with error message if fee calculation fails', async () => {
    const {
      id,
      event,
      context,
      transactionRequests,
      handleUserInputSpy,
      updateFlow,
      getFeesSpy,
      getTransactionRequestSpy,
      upsertTransactionRequestSpy,
    } = await prepareMockData();
    const request = transactionRequests[0];

    getFeesSpy.mockRejectedValue('');

    getTransactionRequestSpy.mockResolvedValue(request);

    await executeFeeTokenSelectorController.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
    expect(updateFlow).toHaveBeenCalledWith(ExecuteTxnUI, request, {
      errors: {
        fees: 'Error calculating fees',
      },
    });
    expect(upsertTransactionRequestSpy).toHaveBeenCalledTimes(0);
  });

  it('updates dialog with error message if not enough to pay for fee', async () => {
    const {
      id,
      event,
      context,
      transactionRequests,
      handleUserInputSpy,
      updateFlow,
      getFeesSpy,
      getTransactionRequestSpy,
      upsertTransactionRequestSpy,
    } = await prepareMockData();
    const request = transactionRequests[0];

    getTransactionRequestSpy.mockResolvedValue(request);

    const estimateResults = getEstimateFees();
    getFeesSpy.mockResolvedValue({
      includeDeploy: false,
      suggestedMaxFee: estimateResults[0].suggestedMaxFee,
      estimateResults,
    });

    await executeFeeTokenSelectorController.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
    expect(updateFlow).toHaveBeenCalledWith(ExecuteTxnUI, request, {
      errors: {
        fees: 'Not enough funds to pay for fee',
      },
    });
    expect(upsertTransactionRequestSpy).toHaveBeenCalledTimes(0);
  });

  it('updates dialog with and save states if enough to pay for fee', async () => {
    const {
      id,
      event,
      context,
      transactionRequests,
      handleUserInputSpy,
      updateFlow,
      hasSufficientFundsSpy,
      getFeesSpy,
      getTransactionRequestSpy,
      upsertTransactionRequestSpy,
    } = await prepareMockData();
    const request = transactionRequests[0];

    getTransactionRequestSpy.mockResolvedValue(request);

    const estimateResults = getEstimateFees();
    getFeesSpy.mockResolvedValue({
      includeDeploy: false,
      suggestedMaxFee: estimateResults[0].suggestedMaxFee,
      estimateResults,
    });
    hasSufficientFundsSpy.mockResolvedValue(true);

    await executeFeeTokenSelectorController.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
    expect(updateFlow).toHaveBeenCalledWith(ExecuteTxnUI, request);
    expect(upsertTransactionRequestSpy).toHaveBeenCalledWith(request);
  });

  it('throws error if no signer in request state', async () => {
    const { id, event, context } = await prepareMockData();
    await expect(
      executeFeeTokenSelectorController.execute(id, event, context),
    ).rejects.toThrow('No signer found in stored request state');
  });
});
