import type { Invocations } from 'starknet';
import { constants, TransactionType } from 'starknet';
import type { Infer } from 'superstruct';

import callsExamples from '../__tests__/fixture/callsExamples.json';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import type { TxVersionStruct } from '../utils/superstruct';
import {
  mockAccount,
  mockGetEstimatedFeesResponse,
  prepareMockAccount,
} from './__tests__/helper';
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
      payload: callsExamples.singleCall.calls,
    },
  ];

  const request = {
    chainId,
    address,
    invocations,
    details: { version },
  } as unknown as EstimateFeeParams;

  return {
    invocations,
    request,
    ...mockGetEstimatedFeesResponse({
      includeDeploy,
    }),
  };
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
    const {
      request,
      getEstimatedFeesSpy,
      getEstimatedFeesResponse: {
        includeDeploy,
        overallFee,
        suggestedMaxFee,
        unit,
      },
    } = prepareMockEstimateFee({
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
      includeDeploy,
      overallFee,
      suggestedMaxFee,
      unit,
    });
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      estimateFee.execute({} as unknown as EstimateFeeParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
