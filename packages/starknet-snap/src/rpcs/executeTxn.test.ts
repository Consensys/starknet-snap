import type { Invocations, UniversalDetails } from 'starknet';
import { TransactionType, constants } from 'starknet';

import invocationExamples from '../__tests__/fixture/invocationExamples.json'; // Assuming you have a similar fixture
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

const prepareMockExecuteTxn = (
  transactionHash: string,
  accountDeployed: boolean,
) => {
  const executeTxnRespMock = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_hash: transactionHash,
  };

  const getEstmatedFeesRepsMock = {
    suggestedMaxFee: BigInt(1000000000000000).toString(10),
    overallFee: BigInt(1000000000000000).toString(10),
    includeDeploy: !accountDeployed,
    unit: 'wei',
  };
  const getEstimatedFeesStub = jest.spyOn(starknetUtils, 'getEstimatedFees');
  getEstimatedFeesStub.mockResolvedValue(getEstmatedFeesRepsMock);

  const executeTxnUtilStub = jest.spyOn(starknetUtils, 'executeTxn');
  executeTxnUtilStub.mockResolvedValue(executeTxnRespMock);

  const createAccountStub = jest.spyOn(starknetUtils, 'createAccount');
  createAccountStub.mockResolvedValue({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_hash: '0x123',
    address: '0x234',
  });

  return {
    createAccountStub,
    executeTxnRespMock,
    getEstimatedFeesStub,
    getEstmatedFeesRepsMock,
  };
};

describe('ExecuteTxn', () => {
  let invocationExample: any;
  const enableAuthorize = true;
  const state = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const createRequestParam = (
    chainId: constants.StarknetChainId,
    address: string,
    invocations: Invocations,
    details: UniversalDetails,
    transactionType?: TransactionType,
  ): ExecuteTxnParams => {
    if (transactionType) {
      invocations.forEach((invocation) => {
        invocation.type = transactionType;
      });
    }
    const request: ExecuteTxnParams = {
      chainId,
      address,
      invocations,
      details,
    } as ExecuteTxnParams;
    if (enableAuthorize) {
      request.enableAuthorize = enableAuthorize;
    }
    return request;
  };

  it('executes transaction correctly when account is deployed', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
    invocationExample = invocationExamples.shift();

    prepareMockAccount(account, state);
    prepareConfirmDialog();
    const { createAccountStub, executeTxnRespMock, getEstimatedFeesStub } =
      prepareMockExecuteTxn(invocationExample.hash, true);

    const request = createRequestParam(
      state.networks[0].chainId as any,
      account.address,
      invocationExample.invocations,
      invocationExample.details,
    );

    const result = await executeTxn.execute(request);

    expect(result).toStrictEqual(executeTxnRespMock);
    expect(executeTxnUtil).toHaveBeenCalledWith(
      expect.anything(),
      account.address,
      account.privateKey,
      request.invocations.map((invocation) => invocation.payload),
      undefined,
      expect.objectContaining({
        maxFee: '1000000000000000',
        nonce: undefined,
      }),
    );
    expect(getEstimatedFeesStub).toHaveBeenCalled();
    expect(createAccountStub).not.toHaveBeenCalled();
  });

  it('executes transaction correctly when account is not deployed', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
    invocationExample = invocationExamples.shift();

    prepareMockAccount(account, state);
    prepareConfirmDialog();
    const { createAccountStub, executeTxnRespMock, getEstimatedFeesStub } =
      prepareMockExecuteTxn(invocationExample.hash, false);

    const request = createRequestParam(
      state.networks[0].chainId as any,
      account.address,
      invocationExample.invocations,
      invocationExample.details,
    );

    const result = await executeTxn.execute(request);

    expect(result).toStrictEqual(executeTxnRespMock);
    expect(getEstimatedFeesStub).toHaveBeenCalled();
    expect(createAccountStub).toHaveBeenCalledTimes(1);
  });

  it('throws error if invocations are empty', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
    prepareMockAccount(account, state);
    prepareConfirmDialog();
    prepareMockExecuteTxn(invocationExample.hash, true);

    const request = createRequestParam(
      state.networks[0].chainId as any,
      account.address,
      invocationExample.invocations,
      invocationExample.details,
    );

    request.invocations = [];

    await expect(executeTxn.execute(request)).rejects.toThrow(
      'Invocations cannot be empty',
    );
  });

  it.each([
    TransactionType.DECLARE,
    TransactionType.DEPLOY,
    TransactionType.DEPLOY_ACCOUNT,
  ])(
    `throws error if invocation type is %s`,
    async (transactionType: TransactionType) => {
      const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
      prepareMockAccount(account, state);
      prepareConfirmDialog();
      prepareMockExecuteTxn(invocationExample.hash, true);

      const request = createRequestParam(
        state.networks[0].chainId as any,
        account.address,
        invocationExample.invocations,
        invocationExample.details,
      );

      request.invocations[0].type = transactionType;
      request.invocations[0].payload = {};

      await expect(executeTxn.execute(request)).rejects.toThrow(
        `Invocations should be of type INVOKE_FUNCTION received ${transactionType}`,
      );
    },
  );
});
