import type { InterfaceContext, UserInputEvent } from '@metamask/snaps-sdk';
import { constants } from 'starknet';

import {
  generateTransactionRequests,
  getEstimateFees,
} from '../__tests__/helper';
import { mockAccount, prepareMockAccount } from '../rpcs/__tests__/helper';
import { TransactionRequestStateManager } from '../state/request-state-manager';
import type { SnapState } from '../types/snapState';
import * as uiUtils from '../ui/utils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import * as starknetUtils from '../utils/starknetUtils';
import { feeTokenSelectorController } from './fee-token-selector';

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

    const updateExecuteTxnFlowSpy = jest.spyOn(uiUtils, 'updateExecuteTxnFlow');

    const getTransactionRequestSpy = jest.spyOn(
      TransactionRequestStateManager.prototype,
      'getTransactionRequest',
    );

    const upsertTransactionRequestSpy = jest.spyOn(
      TransactionRequestStateManager.prototype,
      'upsertTransactionRequest',
    );

    const handleUserInputSpy = jest.spyOn(
      feeTokenSelectorController as any,
      'handleUserInput',
    );
    const getFeesSpy = jest.spyOn(feeTokenSelectorController as any, 'getFees');
    const hasSufficientFundsSpy = jest.spyOn(
      starknetUtils as any,
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
      updateExecuteTxnFlowSpy,
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
      updateExecuteTxnFlowSpy,
      getFeesSpy,
      getTransactionRequestSpy,
      upsertTransactionRequestSpy,
    } = await prepareMockData();
    const request = transactionRequests[0];

    getFeesSpy.mockRejectedValue('');

    getTransactionRequestSpy.mockResolvedValue(request);

    await feeTokenSelectorController.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
    expect(updateExecuteTxnFlowSpy).toHaveBeenCalledWith(request, {
      fees: 'Error calculating fees',
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
      updateExecuteTxnFlowSpy,
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

    await feeTokenSelectorController.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
    expect(updateExecuteTxnFlowSpy).toHaveBeenCalledWith(request, {
      fees: 'Not enough funds to pay for fee',
    });
    expect(upsertTransactionRequestSpy).toHaveBeenCalledTimes(0);
  });

  it('updates dialog with if enough to pay for fee', async () => {
    const {
      id,
      event,
      context,
      transactionRequests,
      handleUserInputSpy,
      updateExecuteTxnFlowSpy,
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

    await feeTokenSelectorController.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
    expect(updateExecuteTxnFlowSpy).toHaveBeenCalledWith(request);
    expect(upsertTransactionRequestSpy).toHaveBeenCalledWith(request);
  });

  it('throws error if no signer in request state', async () => {
    const { id, event, context } = await prepareMockData();
    await expect(
      feeTokenSelectorController.execute(id, event, context),
    ).rejects.toThrow('No signer found in stored request state');
  });
});
