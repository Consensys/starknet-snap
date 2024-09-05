import {
  InvalidParamsError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { UniversalDetails, Call, InvokeFunctionResponse } from 'starknet';
import { constants } from 'starknet';

import callsExamples from '../__tests__/fixture/callsExamples.json'; // Assuming you have a similar fixture
import type { FeeTokenUnit } from '../types/snapApi';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import * as starknetUtils from '../utils/starknetUtils';
import { executeTxn as executeTxnUtil } from '../utils/starknetUtils';
import {
  mockAccount,
  prepareConfirmDialog,
  prepareMockAccount,
} from './__tests__/helper';
import type { ExecuteTxnParams } from './executeTxn';
import { executeTxn } from './executeTxn';

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
  const { confirmDialogSpy } = prepareConfirmDialog();

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

  const getEstimatedFeesRepsMock = {
    suggestedMaxFee: BigInt(1000000000000000).toString(10),
    overallFee: BigInt(1000000000000000).toString(10),
    includeDeploy: !accountDeployed,
    unit: 'wei' as FeeTokenUnit,
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

  return {
    network: state.networks[0],
    account,
    request,
    confirmDialogSpy,
    createAccountSpy,
    executeTxnRespMock,
    executeTxnUtilSpy,
    getEstimatedFeesSpy,
    getEstimatedFeesRepsMock,
  };
};

describe('ExecuteTxn', () => {
  let callsExample: any;

  it('executes transaction correctly if the account is deployed', async () => {
    callsExample = callsExamples[0];
    const {
      account,
      createAccountSpy,
      executeTxnRespMock,
      getEstimatedFeesSpy,
      getEstimatedFeesRepsMock,
      request,
    } = await prepareMockExecuteTxn(
      callsExample.hash,
      callsExample.calls,
      callsExample.details,
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
        ...callsExample.details,
        maxFee: getEstimatedFeesRepsMock.suggestedMaxFee,
      },
    );
    expect(getEstimatedFeesSpy).toHaveBeenCalled();
    expect(createAccountSpy).not.toHaveBeenCalled();
  });

  it.each([constants.TRANSACTION_VERSION.V1, constants.TRANSACTION_VERSION.V3])(
    'creates an account and execute the transaction with nonce 1 with transaction version %s if the account is not deployed',
    async (transactionVersion) => {
      callsExample = callsExamples[1];
      const {
        account,
        createAccountSpy,
        executeTxnUtilSpy,
        getEstimatedFeesSpy,
        getEstimatedFeesRepsMock,
        network,
        request,
      } = await prepareMockExecuteTxn(
        callsExample.hash,
        callsExample.calls,
        {
          ...callsExample.details,
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
        waitMode: true,
      });
      expect(executeTxnUtilSpy).toHaveBeenCalledWith(
        network,
        account.address,
        account.privateKey,
        callsExample.calls,
        undefined,
        {
          ...callsExample.details,
          version: transactionVersion,
          maxFee: getEstimatedFeesRepsMock.suggestedMaxFee,
          nonce: 1,
        },
      );
    },
  );

  it('throws UserRejectedRequestError if user cancels execution', async () => {
    callsExample = callsExamples[1];
    const { request, confirmDialogSpy } = await prepareMockExecuteTxn(
      callsExample.hash,
      callsExample.calls,
      callsExample.details,
      true,
    );
    confirmDialogSpy.mockResolvedValue(false);

    await expect(executeTxn.execute(request)).rejects.toThrow(
      UserRejectedRequestError,
    );
  });

  it('throws `Failed to execute transaction` when the transaction hash is not returned from executeTxnUtil', async () => {
    callsExample = callsExamples[1];
    const { request, executeTxnUtilSpy } = await prepareMockExecuteTxn(
      callsExample.hash,
      callsExample.calls,
      callsExample.details,
      true,
    );
    executeTxnUtilSpy.mockResolvedValue(
      {} as unknown as InvokeFunctionResponse,
    );

    await expect(executeTxn.execute(request)).rejects.toThrow(Error);
  });

  it('throws `InvalidParamsError` when request parameter is not correct', async () => {
    await expect(
      executeTxn.execute({} as unknown as ExecuteTxnParams),
    ).rejects.toThrow(InvalidParamsError);
  });
});
