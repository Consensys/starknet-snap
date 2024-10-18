import type { Invocations } from 'starknet';
import { constants, TransactionType } from 'starknet';
import type { Infer } from 'superstruct';

import { getEstimateFees } from '../__tests__/helper';
import { FeeTokenUnit } from '../types/snapApi';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import type { TxVersionStruct } from '../utils/superstruct';
import { mockAccount, prepareMockAccount } from './__tests__/helper';
import { estimateFee } from './estimate-fee';
import type { EstimateFeeParams } from './estimate-fee';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

const prepareMockEstimateFee = ({
  chainId,
  address,
  version,
  includeDeploy = false,
}: {
  chainId: constants.StarknetChainId;
  address: string;
  version: Infer<typeof TxVersionStruct>;
  includeDeploy?: boolean;
}) => {
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

  const request = {
    chainId,
    address,
    invocations,
    details: { version },
  } as unknown as EstimateFeeParams;

  const estimateResults = getEstimateFees();

  const estimateBulkFeeRespMock = {
    suggestedMaxFee: BigInt(1000000000000000).toString(10),
    overallFee: BigInt(1500000000000000).toString(10),
    unit: FeeTokenUnit.ETH,
    includeDeploy,
    estimateResults,
  };

  const getEstimatedFeesSpy = jest.spyOn(starknetUtils, 'getEstimatedFees');
  getEstimatedFeesSpy.mockResolvedValue(estimateBulkFeeRespMock);

  return { estimateBulkFeeRespMock, invocations, request, getEstimatedFeesSpy };
};

describe('estimateFee', () => {
  const state = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  it('estimates fee correctly', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { request, getEstimatedFeesSpy, estimateBulkFeeRespMock } =
      prepareMockEstimateFee({
        includeDeploy: false,
        chainId,
        address: account.address,
        version: constants.TRANSACTION_VERSION.V1,
      });

    const result = await estimateFee.execute(request);

    expect(getEstimatedFeesSpy).toHaveBeenCalledWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account.address,
      account.privateKey,
      account.publicKey,
      request.invocations,
      {
        version: constants.TRANSACTION_VERSION.V1,
      },
    );
    expect(result).toStrictEqual({
      includeDeploy: estimateBulkFeeRespMock.includeDeploy,
      overallFee: estimateBulkFeeRespMock.overallFee,
      suggestedMaxFee: estimateBulkFeeRespMock.suggestedMaxFee,
      unit: estimateBulkFeeRespMock.unit,
    });
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      estimateFee.execute({} as unknown as EstimateFeeParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
