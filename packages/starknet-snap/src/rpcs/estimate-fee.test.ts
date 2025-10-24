import type { Invocations } from 'starknet';
import { constants, TransactionType } from 'starknet';
import type { Infer } from 'superstruct';

import callsExamples from '../__tests__/fixture/callsExamples.json';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import type { TxVersionStruct } from '../utils/superstruct';
import { createAccountObject } from '../wallet/account/__test__/helper';
import {
  mockGetEstimatedFeesResponse,
  setupAccountController,
} from './__tests__/helper';
import { estimateFee } from './estimate-fee';
import type { EstimateFeeParams } from './estimate-fee';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('estimateFee', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupMockEstimateFeeTest = ({
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

  it('estimates fee correctly', async () => {
    const { chainId } = network;
    const { accountObj: account } = await createAccountObject(network);
    await setupAccountController({
      accountObj: account,
    });

    const {
      request,
      getEstimatedFeesSpy,
      getEstimatedFeesResponse: {
        includeDeploy,
        overallFee,
        suggestedMaxFee,
        unit,
      },
    } = setupMockEstimateFeeTest({
      chainId: chainId as constants.StarknetChainId,
      address: account.address,
      version: constants.TRANSACTION_VERSION.V1,
    });

    const result = await estimateFee.execute(request);

    expect(getEstimatedFeesSpy).toHaveBeenCalledWith(
      network,
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
