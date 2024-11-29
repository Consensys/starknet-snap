import { constants, TransactionExecutionStatus, TransactionFinalityStatus } from 'starknet';

import { Config } from '../config';
import { NetworkStateManager } from '../state/network-state-manager';
import { TokenStateManager } from '../state/token-state-manager';
import type { Network } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  InvalidRequestParamsError,
  TokenIsPreloadedError,
  InvalidNetworkError,
  UserRejectedOpError,
} from '../utils/exceptions';
import { prepareRenderWatchAssetUI } from './__tests__/helper';
import type { GetTransactionStatusParams } from './get-transaction-status';
import { getTransactionStatus } from './get-transaction-status';
import { mockNetworkStateManager } from '../state/__tests__/helper';

import * as starknetUtils from '../utils/starknetUtils';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('GetTransactionStatusRpc', () => {
 
  const prepareWatchAssetTest = ({
    network = STARKNET_SEPOLIA_TESTNET_NETWORK,
  }: {
    network?: Network;
  }) => {
    const { getNetworkSpy } = mockNetworkStateManager(
      network,
    );

    const getTransactionStatusSpy = jest.spyOn(starknetUtils, 'getTransactionStatus')
    
    getTransactionStatusSpy.mockResolvedValue({
      finalityStatus: TransactionFinalityStatus.ACCEPTED_ON_L1,
      executionStatus: TransactionExecutionStatus.SUCCEEDED
    })

    return {
      getTransactionStatusSpy,
      getNetworkSpy
    };
  };

  it('returns transaction status', async () => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const { getNetworkSpy, getTransactionStatusSpy } = prepareWatchAssetTest({network});

    const expectedResult = true;

    const result = await getTransactionStatus.execute({
      chainId: network.chainId as unknown as constants.StarknetChainId,

    });

    expect(result).toStrictEqual(expectedResult);
  });

 
  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      watchAsset.execute({} as unknown as WatchAssetParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
