import {
  InvalidParamsError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { UniversalDetails, Call } from 'starknet';
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

  const getEstmatedFeesRepsMock = {
    suggestedMaxFee: BigInt(1000000000000000).toString(10),
    overallFee: BigInt(1000000000000000).toString(10),
    includeDeploy: !accountDeployed,
    unit: 'wei' as FeeTokenUnit,
  };
  const getEstimatedFeesSpy = jest.spyOn(starknetUtils, 'getEstimatedFees');
  getEstimatedFeesSpy.mockResolvedValue(getEstmatedFeesRepsMock);

  const executeTxnUtilSpy = jest.spyOn(starknetUtils, 'executeTxn');
  executeTxnUtilSpy.mockResolvedValue(executeTxnRespMock);

  const createAccountSpy = jest.spyOn(starknetUtils, 'createAccount');
  createAccountSpy.mockResolvedValue({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_hash:
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
    getEstmatedFeesRepsMock,
  };
};

describe('ExecuteTxn', () => {
  let callsExample: any;

  it('executes transaction correctly when account is deployed', async () => {
    callsExample = callsExamples[0];
    const {
      account,
      request,
      createAccountSpy,
      executeTxnRespMock,
      getEstimatedFeesSpy,
    } = await prepareMockExecuteTxn(
      callsExample.hash,
      callsExample.calls,
      callsExample.details,
      true,
    );

    const result = await executeTxn.execute(request);

    expect(result).toStrictEqual(executeTxnRespMock);
    expect(executeTxnUtil).toHaveBeenCalledWith(
      expect.anything(),
      account.address,
      account.privateKey,
      request.calls,
      undefined,
      expect.objectContaining({
        maxFee: '1000000000000000',
        nonce: undefined,
      }),
    );
    expect(getEstimatedFeesSpy).toHaveBeenCalled();
    expect(createAccountSpy).not.toHaveBeenCalled();
  });

  it('executes transaction correctly when account is not deployed', async () => {
    callsExample = callsExamples[1];
    const {
      account,
      request,
      network,
      createAccountSpy,
      executeTxnRespMock,
      getEstimatedFeesSpy,
      executeTxnUtilSpy,
    } = await prepareMockExecuteTxn(
      callsExample.hash,
      callsExample.calls,
      callsExample.details,
      false,
    );

    const result = await executeTxn.execute(request);

    expect(result).toStrictEqual(executeTxnRespMock);
    expect(getEstimatedFeesSpy).toHaveBeenCalled();
    expect(createAccountSpy).toHaveBeenCalledTimes(1);
    expect(executeTxnUtilSpy).toHaveBeenCalledWith(
      network,
      account.address,
      account.privateKey,
      callsExample.calls,
      undefined,
      {
        ...callsExample.details,
        nonce: 1,
      },
    );
  });

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

  it('throws error if calls are empty', async () => {
    callsExample = Object.assign({}, callsExamples[1]);
    const { request } = await prepareMockExecuteTxn(
      callsExample.hash,
      callsExample.calls,
      callsExample.details,
      true,
    );
    request.calls = [];

    await expect(executeTxn.execute(request)).rejects.toThrow(
      'Calls cannot be empty',
    );
  });

  it.each([
    {
      case: 'executeTxnUtil response is undefined',
      executeTxnUtilResp: {},
    },
    {
      case: 'executeTxnUtil response.transaction_hash is undefined',
      executeTxnUtilResp: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        transaction_hash: undefined,
      },
    },
  ])(
    'throws `Error` when $case',
    async ({ executeTxnUtilResp }: { executeTxnUtilResp: unknown }) => {
      callsExample = callsExamples[1];
      const { request, executeTxnUtilSpy } = await prepareMockExecuteTxn(
        callsExample.hash,
        callsExample.calls,
        callsExample.details,
        true,
      );
      executeTxnUtilSpy.mockResolvedValue(executeTxnUtilResp as any);
      await expect(executeTxn.execute(request)).rejects.toThrow(Error);
    },
  );

  it('throws `InvalidParamsError` when request parameter is not correct', async () => {
    await expect(
      executeTxn.execute({} as unknown as ExecuteTxnParams),
    ).rejects.toThrow(InvalidParamsError);
  });
});
