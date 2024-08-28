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

const prepareMockExecuteTxn = async (
  transactionHash: string,
  accountDeployed: boolean,
) => {
  const state = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

  prepareMockAccount(account, state);
  prepareConfirmDialog();

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
    network: state.networks[0],
    account,
    createAccountStub,
    executeTxnRespMock,
    getEstimatedFeesStub,
    getEstmatedFeesRepsMock,
  };
};

describe('ExecuteTxn', () => {
  let callsExample: any;

  const createRequestParam = (
    chainId: constants.StarknetChainId,
    address: string,
    calls: Call[],
    details: UniversalDetails,
  ): ExecuteTxnParams => {
    const request: ExecuteTxnParams = {
      chainId,
      address,
      calls,
      details,
    } as ExecuteTxnParams;
    return request;
  };

  it('executes transaction correctly when account is deployed', async () => {
    callsExample = callsExamples.shift();
    const {
      account,
      network,
      createAccountStub,
      executeTxnRespMock,
      getEstimatedFeesStub,
    } = await prepareMockExecuteTxn(callsExample.hash, true);

    const request = createRequestParam(
      network.chainId as any,
      account.address,
      callsExample.calls,
      callsExample.details,
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
    expect(getEstimatedFeesStub).toHaveBeenCalled();
    expect(createAccountStub).not.toHaveBeenCalled();
  });

  it('executes transaction correctly when account is not deployed', async () => {
    callsExample = callsExamples.shift();
    const {
      account,
      createAccountStub,
      executeTxnRespMock,
      getEstimatedFeesStub,
      network,
    } = await prepareMockExecuteTxn(callsExample.hash, false);

    const request = createRequestParam(
      network.chainId as any,
      account.address,
      callsExample.calls,
      callsExample.details,
    );
    const result = await executeTxn.execute(request);

    expect(result).toStrictEqual(executeTxnRespMock);
    expect(getEstimatedFeesStub).toHaveBeenCalled();
    expect(createAccountStub).toHaveBeenCalledTimes(1);
  });

  it('throws error if invocations are empty', async () => {
    const { account, network } = await prepareMockExecuteTxn(
      callsExample.hash,
      true,
    );

    const request = createRequestParam(
      network.chainId as any,
      account.address,
      callsExample.calls,
      callsExample.details,
    );

    request.calls = [];

    await expect(executeTxn.execute(request)).rejects.toThrow(
      'Calls cannot be empty',
    );
  });
});
