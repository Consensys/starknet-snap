import type { InterfaceContext, UserInputEvent } from '@metamask/snaps-sdk';
import { constants } from 'starknet';

import {
  generateTransactionRequests,
  getEstimateFees,
} from '../__tests__/helper';
import { mockAccount, prepareMockAccount } from '../rpcs/__tests__/helper';
import type { SnapState } from '../types/snapState';
import * as uiUtils from '../ui/utils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { feeTokenSelectorController } from './fee-token-selector';
import * as userInputUtils from './utils';

jest.mock('../state/token-state-manager');
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
    const chainId = getChainId();
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
    prepareMockAccount(account, state);

    const updateExecuteTxnFlowSpy = jest.spyOn(uiUtils, 'updateExecuteTxnFlow');

    const handleUserInputSpy = jest.spyOn(
      feeTokenSelectorController as any,
      'handleUserInput',
    );
    const getFeesSpy = jest.spyOn(feeTokenSelectorController as any, 'getFees');
    const hasSufficientFundsSpy = jest.spyOn(
      userInputUtils as any,
      'hasSufficientFunds',
    );

    const transactionRequests = generateTransactionRequests({
      chainId,
      address: account.address,
      cnt: 10,
    });

    const context = { request: transactionRequests[0] } as InterfaceContext;

    return {
      id,
      event,
      context,
      handleUserInputSpy,
      updateExecuteTxnFlowSpy,
      transactionRequests,
      getFeesSpy,
      hasSufficientFundsSpy,
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
    } = await prepareMockData();
    const request = transactionRequests[0];

    getFeesSpy.mockRejectedValue('');

    await feeTokenSelectorController.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
    expect(updateExecuteTxnFlowSpy).toHaveBeenCalledWith(id, request, {
      errors: {
        fees: 'Error calculating fees',
      },
    });
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
    } = await prepareMockData();
    const request = transactionRequests[0];

    const estimateResults = getEstimateFees();
    getFeesSpy.mockResolvedValue({
      includeDeploy: false,
      suggestedMaxFee: estimateResults[0].suggestedMaxFee,
      estimateResults,
    });

    await feeTokenSelectorController.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
    expect(updateExecuteTxnFlowSpy).toHaveBeenCalledWith(id, request, {
      errors: {
        fees: 'Not enough funds to pay for fee',
      },
    });
  });

  it('updates dialog with and save states if enough to pay for fee', async () => {
    const {
      id,
      event,
      context,
      transactionRequests,
      handleUserInputSpy,
      updateExecuteTxnFlowSpy,
      hasSufficientFundsSpy,
      getFeesSpy,
    } = await prepareMockData();
    const request = transactionRequests[0];

    const estimateResults = getEstimateFees();
    getFeesSpy.mockResolvedValue({
      includeDeploy: false,
      suggestedMaxFee: estimateResults[0].suggestedMaxFee,
      estimateResults,
    });
    hasSufficientFundsSpy.mockResolvedValue(true);

    await feeTokenSelectorController.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
    expect(updateExecuteTxnFlowSpy).toHaveBeenCalledWith(id, request);
  });
});
