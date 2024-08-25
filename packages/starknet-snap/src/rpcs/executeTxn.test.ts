import { UserRejectedRequestError } from '@metamask/snaps-sdk';
import {
  constants,
  Invocations,
  stark,
  transaction,
  TransactionType,
  UniversalDetails,
} from 'starknet';
import invocationExample from '../__tests__/fixture/invocationExample.json'; // Assuming you have a similar fixture

import * as starknetUtils from '../utils/starknetUtils';
import {
  createAccount,
  executeTxn as executeTxnUtil,
  getAccContractAddressAndCallData,
  getEstimatedFees,
  isAccountDeployed,
} from '../utils/starknetUtils';
import {
  mockAccount,
  prepareConfirmDialog,
  prepareMockAccount,
} from './__tests__/helper';
import { ACCOUNT_CLASS_HASH, STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { executeTxn, ExecuteTxnParams, ExecuteTxnRpc } from './executeTxn';

const prepareMockExecuteTxn = () => {
  const executeTxnRespMock = {
    transaction_hash: '0x123',
  };

  const getEstimatedFees = jest.spyOn(starknetUtils, 'getEstimatedFees');
  getEstimatedFees.mockResolvedValue({
    suggestedMaxFee: BigInt(1000000000000000).toString(10),
    overallFee: BigInt(1000000000000000).toString(10),
    includeDeploy: false,
    unit: 'wei',
  });

  const executeTxnUtil = jest.spyOn(starknetUtils, 'executeTxn');
  executeTxnUtil.mockResolvedValue(executeTxnRespMock);
  
  return executeTxnRespMock;
}

describe('ExecuteTxn', () => {
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
    enableAuthorize?: boolean,
    transactionType?: TransactionType,
  ): ExecuteTxnParams => {
    const details = {
      ...invocationExample.invocationsDetails,
      version: invocationExample.invocationsDetails.version as '0x2' | '0x3',
    };
    if (transactionType) {
      invocationExample.invocations.map((invocation) => {
        invocation.type = transactionType;
      });
    }
    const request: ExecuteTxnParams = {
      chainId,
      address,
      invocations: invocationExample.invocations as Invocations,
      details,
    } as ExecuteTxnParams;
    if (enableAuthorize) {
      request.enableAuthorize = enableAuthorize;
    }
    return request;
  };

  it('executes transaction correctly when account is deployed', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    prepareConfirmDialog();
    const executeTxnRespMock = prepareMockExecuteTxn();

    const isAccountDeployed = jest.spyOn(starknetUtils, 'isAccountDeployed');
    isAccountDeployed.mockResolvedValue(true);

    const request = createRequestParam(
      state.networks[0].chainId as any,
      account.address,
      enableAuthorize,
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
    expect(getEstimatedFees).toHaveBeenCalled();
    expect(starknetUtils.isAccountDeployed).toHaveBeenCalledWith(
      expect.anything(),
      account.address,
    );
  });
  it('executes transaction correctly when account is not deployed', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    prepareConfirmDialog();
    const executeTxnRespMock = prepareMockExecuteTxn();

    const isAccountDeployed = jest.spyOn(starknetUtils, 'isAccountDeployed');
    isAccountDeployed.mockResolvedValue(false);

    const createAccount = jest.spyOn(starknetUtils, 'createAccount');
    createAccount.mockResolvedValue({
      address: account.address,
      transaction_hash: ""
    });

    const request = createRequestParam(
      state.networks[0].chainId as any,
      account.address,
      enableAuthorize,
    );

    const invocations = request.invocations.map((invocation) => invocation.payload);
    const result = await executeTxn.execute(request);

    expect(result).toStrictEqual(executeTxnRespMock);
    expect(executeTxnUtil).toHaveBeenCalledWith(
      expect.anything(),
      account.address,
      account.privateKey,
      invocations,
      undefined,
      expect.objectContaining({
        maxFee: '1000000000000000',
        nonce: 1,
      }),
    );
    expect(createAccount).toHaveBeenCalledTimes(1);
  });

  it('throws error if invocations are empty', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    prepareConfirmDialog();
    const executeTxnRespMock = prepareMockExecuteTxn();

    const isAccountDeployed = jest.spyOn(starknetUtils, 'isAccountDeployed');
    isAccountDeployed.mockResolvedValue(true);

    const request = createRequestParam(
      state.networks[0].chainId as any,
      account.address,
      enableAuthorize,
    );

    request.invocations = [];
    
    await expect(executeTxn.execute(request)).rejects.toThrow("At path:  -- Invocations cannot be empty")
  });

  it.each([TransactionType.DECLARE, TransactionType.DEPLOY, TransactionType.DEPLOY_ACCOUNT])(
    `throws error if invocation type is %s`,
    async (transactionType: TransactionType) => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    prepareConfirmDialog();
    prepareMockExecuteTxn();

    const isAccountDeployed = jest.spyOn(starknetUtils, 'isAccountDeployed');
    isAccountDeployed.mockResolvedValue(true);

    const request = createRequestParam(
      state.networks[0].chainId as any,
      account.address,
      enableAuthorize,
    );

    request.invocations[0].type = transactionType;
    
    await expect(executeTxn.execute(request)).rejects.toThrow(`At path:  -- Invocations should be of type INVOKE_FUNCTION received ${transactionType}`)
  });
});
