import type { ResourceBounds } from 'starknet';
import {
  stark,
  type DeclareSignerDetails,
  type constants,
  EDataAvailabilityMode,
} from 'starknet';

import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import {
  setupAccountController,
  mockRenderSignDeclareTransactionUI,
} from './__tests__/helper';
import { signDeclareTransaction } from './sign-declare-transaction';
import type { SignDeclareTransactionParams } from './sign-declare-transaction';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('signDeclareTransaction', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  /* eslint-disable @typescript-eslint/naming-convention */
  const createRequest = (chainId: string, address: string) => ({
    details: {
      classHash:
        '0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
      compiledClassHash:
        '0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
      senderAddress: address,
      chainId: chainId as constants.StarknetChainId,
      version: '0x3',
      nonce: 0,
      tip: 0,
      paymasterData: [],
      accountDeploymentData: [],
      nonceDataAvailabilityMode: EDataAvailabilityMode.L1,
      feeDataAvailabilityMode: EDataAvailabilityMode.L1,
      resourceBounds: {
        l1_gas: { max_amount: '0', max_price_per_unit: '0' },
        l2_gas: { max_amount: '0', max_price_per_unit: '0' },
        l1_data_gas: { max_amount: '0', max_price_per_unit: '0' },
      },
    } as unknown as SignDeclareTransactionParams['details'],
    address,
    chainId: chainId as constants.StarknetChainId,
  });
  /* eslint-enable @typescript-eslint/naming-convention */

  const setupSignDeclareTransactionTest = async () => {
    const { account } = await setupAccountController({
      network,
    });

    const { confirmDialogSpy } = mockRenderSignDeclareTransactionUI();
    const request = createRequest(network.chainId, account.address);

    return {
      account,
      request,
      confirmDialogSpy,
    };
  };

  it('signs message correctly', async () => {
    const { account, request } = await setupSignDeclareTransactionTest();

    const inputDetails = request.details as unknown as DeclareSignerDetails;
    const expectedResult = await starknetUtils.signDeclareTransaction(
      account.privateKey,
      {
        ...inputDetails,
        resourceBounds: stark.resourceBoundsToBigInt(
          inputDetails.resourceBounds as unknown as ResourceBounds,
        ),
      },
    );

    const result = await signDeclareTransaction.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const { account, request, confirmDialogSpy } =
      await setupSignDeclareTransactionTest();

    await signDeclareTransaction.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledWith({
      senderAddress: account.address,
      chainId: network.chainId,
      networkName: network.name,
      declareTransactions: request.details,
    });
  });

  it('throws `UserRejectedOpError` if user denied the operation', async () => {
    const { request, confirmDialogSpy } =
      await setupSignDeclareTransactionTest();

    confirmDialogSpy.mockResolvedValue(false);

    await expect(signDeclareTransaction.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      signDeclareTransaction.execute(
        {} as unknown as SignDeclareTransactionParams,
      ),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
