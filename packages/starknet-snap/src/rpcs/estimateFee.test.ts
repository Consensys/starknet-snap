import { InvalidParamsError } from '@metamask/snaps-sdk';
import type { Invocations } from 'starknet';
import { constants, TransactionType } from 'starknet';
import type { Infer } from 'superstruct';

import { FeeTokenUnit } from '../types/snapApi';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import * as starknetUtils from '../utils/starknetUtils';
import type { InvocationStruct } from '../utils/superstruct';
import { mockAccount, prepareMockAccount } from './__tests__/helper';
import { estimateFee } from './estimateFee';
import type { EstimateFeeParams } from './estimateFee';

jest.mock('../utils/snap');
jest.mock('../utils/logger');
jest.mock('../utils/starknetUtils');

const prepareMockEstimateFee = (options: any) => {
  const invocations: Invocations = [
    {
      type: TransactionType.INVOKE,
      payload: {
        contractAddress:
          '0x00b28a089e7fb83debee4607b6334d687918644796b47d9e9e38ea8213833137',
        entrypoint: 'functionName',
        calldata: ['1', '1'],
      },
    },
  ];

  const request: EstimateFeeParams = {
    chainId: options.chainId as constants.StarknetChainId,
    address: options.address,
    invocations: invocations as unknown as Infer<typeof InvocationStruct>[],
    details: { version: options.version },
  };

  const estimateBulkFeeRespMock = {
    suggestedMaxFee: BigInt(1000000000000000).toString(10),
    overallFee: BigInt(1500000000000000).toString(10),
    unit: FeeTokenUnit.ETH,
    includeDeploy: options.includeDeploy ?? false,
  };

  const getEstimatedFees = jest.spyOn(starknetUtils, 'getEstimatedFees');
  getEstimatedFees.mockResolvedValue(estimateBulkFeeRespMock);

  (starknetUtils.estimateFeeBulk as jest.Mock).mockResolvedValue(
    estimateBulkFeeRespMock,
  );

  (starknetUtils.isAccountDeployed as jest.Mock).mockResolvedValue(
    options.includeDeploy,
  );

  return { estimateBulkFeeRespMock, getEstimatedFees, invocations, request };
};
describe('estimateFee', () => {
  const state = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  it('estimates fee correctly when account is deployed', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    const { request } = prepareMockEstimateFee({
      includeDeploy: false,
      chainId: state.networks[0].chainId as constants.StarknetChainId,
      address: account.address,
      version: '0x2',
    });

    const result = await estimateFee.execute(request);

    expect(result).toStrictEqual({
      suggestedMaxFee: '1000000000000000',
      overallFee: '1500000000000000',
      unit: FeeTokenUnit.ETH,
      includeDeploy: false,
    });
  });

  it('estimates fee correctly when account is not deployed', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
    prepareMockAccount(account, state);
    const { request } = prepareMockEstimateFee({
      includeDeploy: true,
      chainId: state.networks[0].chainId as constants.StarknetChainId,
      address: account.address,
      version: '0x2',
    });

    (
      starknetUtils.getAccContractAddressAndCallData as jest.Mock
    ).mockReturnValue({
      callData: ['0xCallData'],
    });

    const result = await estimateFee.execute(request);

    expect(result).toStrictEqual({
      suggestedMaxFee: '1000000000000000',
      overallFee: '1500000000000000',
      unit: FeeTokenUnit.ETH,
      includeDeploy: true,
    });
  });

  it('throws `InvalidParamsError` when request parameter is not correct', async () => {
    await expect(
      estimateFee.execute({} as unknown as EstimateFeeParams),
    ).rejects.toThrow(InvalidParamsError);
  });

  it('throws `InvalidParamsError` when request parameter version is not 0x2 or 0x3', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    const { request } = prepareMockEstimateFee({
      includeDeploy: false,
      chainId: state.networks[0].chainId as constants.StarknetChainId,
      address: account.address,
      version: '0x1',
    });

    await expect(estimateFee.execute(request)).rejects.toThrow(
      `At path: details.version -- Expected one of \`"0x2","0x3"\`, but received: "0x1"`,
    );
  });
});
