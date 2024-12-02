import type { constants } from 'starknet';
import {
  TransactionExecutionStatus,
  TransactionFinalityStatus,
} from 'starknet';

import { mockNetworkStateManager } from '../state/__tests__/helper';
import type { Network } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import type { GetTransactionStatusParams } from './get-transaction-status';
import { getTransactionStatus } from './get-transaction-status';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('GetTransactionStatusRpc', () => {
  const prepareGetTransactionStatusTest = ({
    network,
    status,
  }: {
    network: Network;
    status: {
      finalityStatus: TransactionFinalityStatus;
      executionStatus: TransactionExecutionStatus;
    };
  }) => {
    const { getNetworkSpy } = mockNetworkStateManager(network);

    const getTransactionStatusSpy = jest.spyOn(
      starknetUtils,
      'getTransactionStatus',
    );

    getTransactionStatusSpy.mockResolvedValue(status);

    return {
      getTransactionStatusSpy,
      getNetworkSpy,
    };
  };

  it('returns transaction status', async () => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const transactionHash =
      '0x06385d46da9fbed4a5798298b17df069ac5f786e4c9f8f6b81c665540aea245a';
    const expectedResult = {
      finalityStatus: TransactionFinalityStatus.ACCEPTED_ON_L1,
      executionStatus: TransactionExecutionStatus.SUCCEEDED,
    };
    const { getTransactionStatusSpy } = prepareGetTransactionStatusTest({
      network,
      status: expectedResult,
    });

    const result = await getTransactionStatus.execute({
      chainId: network.chainId as unknown as constants.StarknetChainId,
      transactionHash,
    });

    expect(result).toStrictEqual(expectedResult);
    expect(getTransactionStatusSpy).toHaveBeenCalledWith(
      transactionHash,
      network,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      getTransactionStatus.execute({} as unknown as GetTransactionStatusParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
