import type { UniversalDetails, Call, InvokeFunctionResponse } from 'starknet';
import { constants } from 'starknet';

import callsExamples from '../__tests__/fixture/callsExamples.json'; // Assuming you have a similar fixture
import { getEstimateFees } from '../__tests__/helper';
import type { FeeTokenUnit } from '../types/snapApi';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import { executeTxn as executeTxnUtil } from '../utils/starknetUtils';
import {
  generateRandomFee,
  mockAccount,
  mockTransactionRequestStateManager,
  prepareConfirmDialogInteractiveUI,
  prepareMockAccount,
} from './__tests__/helper';
import type { ExecuteTxnParams } from './execute-txn';
import { executeTxn } from './execute-txn';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

const prepareMockExecuteTxn = async (
  transactionHash: string,
  calls: Call[] | Call,
  details: UniversalDetails,
  accountDeployed: boolean,
) => {
  const state = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  const { confirmDialogSpy } = prepareConfirmDialogInteractiveUI();

  const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
  prepareMockAccount(account, state);

  const request: ExecuteTxnParams = {
    chainId: state.networks[0].chainId,
    address: account.address,
    calls,
    details,
  } as ExecuteTxnParams;

  const executeTxnRespMock = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_hash: transactionHash,
  };

  const estimateResults = getEstimateFees();

  const getEstimatedFeesRepsMock = {
    suggestedMaxFee: generateRandomFee('1000000000000000', '2000000000000000'),
    overallFee: generateRandomFee('1000000000000000', '2000000000000000'),
    includeDeploy: !accountDeployed,
    unit: 'wei' as FeeTokenUnit,
    estimateResults,
  };

  const getEstimatedFeesSpy = jest.spyOn(starknetUtils, 'getEstimatedFees');
  getEstimatedFeesSpy.mockResolvedValue(getEstimatedFeesRepsMock);

  const executeTxnUtilSpy = jest.spyOn(starknetUtils, 'executeTxn');
  executeTxnUtilSpy.mockResolvedValue(executeTxnRespMock);

  const createAccountSpy = jest.spyOn(starknetUtils, 'createAccount');
  createAccountSpy.mockResolvedValue({
    transactionHash:
      '0x07f901c023bac6c874691244c4c2332c6825b916fb68d240c807c6156db84fd3',
    address: account.address,
  });

  const createInvokeTxnSpy = jest.spyOn(executeTxn as any, 'createInvokeTxn');

  return {
    network: state.networks[0],
    account,
    request,
    confirmDialogSpy,
    createAccountSpy,
    createInvokeTxnSpy,
    executeTxnRespMock,
    executeTxnUtilSpy,
    getEstimatedFeesSpy,
    getEstimatedFeesRepsMock,
    ...mockTransactionRequestStateManager(),
  };
};

describe('ExecuteTxn', () => {
  it('executes transaction correctly if the account is deployed', async () => {
    const calls = callsExamples.multipleCalls;
    const {
      account,
      createAccountSpy,
      executeTxnRespMock,
      getEstimatedFeesSpy,
      getEstimatedFeesRepsMock,
      upsertTransactionRequestSpy,
      getTransactionRequestSpy,
      request,
    } = await prepareMockExecuteTxn(
      calls.hash,
      calls.calls,
      calls.details,
      true,
    );

    const result = await executeTxn.execute(request);

    expect(result).toStrictEqual(executeTxnRespMock);
    expect(executeTxnUtil).toHaveBeenCalledWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account.address,
      account.privateKey,
      request.calls,
      undefined,
      {
        ...calls.details,
        maxFee: getEstimatedFeesRepsMock.suggestedMaxFee,
        resourceBounds:
          getEstimatedFeesRepsMock.estimateResults[0].resourceBounds,
      },
    );
    expect(getEstimatedFeesSpy).toHaveBeenCalled();
    expect(createAccountSpy).not.toHaveBeenCalled();
    expect(upsertTransactionRequestSpy).toHaveBeenCalled();
    expect(getTransactionRequestSpy).toHaveBeenCalled();
  });

  it.each([
    {
      calls: callsExamples.multipleCalls,
      testCaseTitle: 'an array of call object',
    },
    {
      calls: callsExamples.singleCall,
      testCaseTitle: 'a call object',
    },
  ])(
    'stores transaction in state correctly if the params `calls` is $testCaseTitle',
    async ({ calls }: { calls: any }) => {
      const call = Array.isArray(calls.calls) ? calls.calls[0] : calls.calls;
      const {
        account,
        createAccountSpy,
        createInvokeTxnSpy,
        executeTxnRespMock,
        getEstimatedFeesSpy,
        getEstimatedFeesRepsMock,
        request,
      } = await prepareMockExecuteTxn(
        calls.hash,
        calls.calls,
        calls.details,
        true,
      );

      const result = await executeTxn.execute(request);

      expect(result).toStrictEqual(executeTxnRespMock);
      expect(executeTxnUtil).toHaveBeenCalledWith(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        account.address,
        account.privateKey,
        request.calls,
        undefined,
        {
          ...calls.details,
          maxFee: getEstimatedFeesRepsMock.suggestedMaxFee,
          resourceBounds:
            getEstimatedFeesRepsMock.estimateResults[0].resourceBounds,
        },
      );
      expect(getEstimatedFeesSpy).toHaveBeenCalled();
      expect(createAccountSpy).not.toHaveBeenCalled();
      expect(createInvokeTxnSpy).toHaveBeenCalledWith(
        account.address,
        calls.hash,
        call,
      );
    },
  );

  it.each([constants.TRANSACTION_VERSION.V1, constants.TRANSACTION_VERSION.V3])(
    'creates an account and execute the transaction with nonce 1 with transaction version %s if the account is not deployed',
    async (transactionVersion) => {
      const calls = callsExamples.multipleCalls;
      const {
        account,
        createAccountSpy,
        executeTxnUtilSpy,
        getEstimatedFeesSpy,
        getEstimatedFeesRepsMock,
        network,
        request,
      } = await prepareMockExecuteTxn(
        calls.hash,
        calls.calls,
        {
          ...calls.details,
          version: transactionVersion,
        },
        false,
      );

      await executeTxn.execute(request);

      expect(getEstimatedFeesSpy).toHaveBeenCalled();
      expect(createAccountSpy).toHaveBeenCalledTimes(1);
      expect(createAccountSpy).toHaveBeenCalledWith({
        address: account.address,
        callback: expect.any(Function),
        network,
        privateKey: account.privateKey,
        publicKey: account.publicKey,
        version: transactionVersion,
        waitMode: false,
      });
      expect(executeTxnUtilSpy).toHaveBeenCalledWith(
        network,
        account.address,
        account.privateKey,
        calls.calls,
        undefined,
        {
          ...calls.details,
          version: transactionVersion,
          maxFee: getEstimatedFeesRepsMock.suggestedMaxFee,
          nonce: 1,
          resourceBounds:
            getEstimatedFeesRepsMock.estimateResults[0].resourceBounds,
        },
      );
    },
  );

  it('throws `Failed to retrieve the updated transaction request` error the transaction request can not retrieve after confirmation', async () => {
    const calls = callsExamples.multipleCalls;
    const { getTransactionRequestSpy, request } = await prepareMockExecuteTxn(
      calls.hash,
      calls.calls,
      calls.details,
      true,
    );

    getTransactionRequestSpy.mockResolvedValue(null);

    await expect(executeTxn.execute(request)).rejects.toThrow(
      'Failed to retrieve the updated transaction request',
    );
  });

  it.each([
    {
      executeTxnResult: callsExamples.multipleCalls.hash,
      testCase: 'the transaction executed successfully',
    },
    {
      // Simulate the case where the transaction execution failed and does not return a transaction hash
      // An error `Failed to execute transaction` will be thrown in this case
      executeTxnResult: '',
      testCase: 'the transaction failed to execute',
    },
  ])(
    'removes the transaction request from state if $testCase.',
    async ({ executeTxnResult }) => {
      const calls = callsExamples.multipleCalls;
      const { executeTxnUtilSpy, removeTransactionRequestSpy, request } =
        await prepareMockExecuteTxn(
          executeTxnResult,
          calls.calls,
          calls.details,
          true,
        );

      executeTxnUtilSpy.mockResolvedValue({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        transaction_hash: executeTxnResult,
      });

      try {
        await executeTxn.execute(request);
      } catch (error) {
        // eslint-disable-next-line no-empty
      } finally {
        expect(removeTransactionRequestSpy).toHaveBeenCalled();
      }
    },
  );

  it('throws UserRejectedOpError if user cancels execution', async () => {
    const calls = callsExamples.multipleCalls;
    const { request, confirmDialogSpy } = await prepareMockExecuteTxn(
      calls.hash,
      calls.calls,
      calls.details,
      true,
    );
    confirmDialogSpy.mockResolvedValue(false);

    await expect(executeTxn.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it('throws `Failed to execute transaction` when the transaction hash is not returned from executeTxnUtil', async () => {
    const calls = callsExamples.multipleCalls;
    const { request, executeTxnUtilSpy } = await prepareMockExecuteTxn(
      calls.hash,
      calls.calls,
      calls.details,
      true,
    );
    executeTxnUtilSpy.mockResolvedValue(
      {} as unknown as InvokeFunctionResponse,
    );

    await expect(executeTxn.execute(request)).rejects.toThrow(Error);
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      executeTxn.execute({} as unknown as ExecuteTxnParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
