import type { InvocationsSignerDetails, constants } from 'starknet';

import transactionExample from '../__tests__/fixture/transactionExample.json'; // Assuming you have a similar fixture
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import {
  setupAccountController,
  mockRenderSignTransactionUI,
} from './__tests__/helper';
import { signTransaction } from './sign-transaction';
import type { SignTransactionParams } from './sign-transaction';

jest.mock('../utils/logger');

describe('signTransaction', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupSignTransactionTest = async (enableAuthorize = false) => {
    const { account } = await setupAccountController({
      network,
    });

    const { confirmDialogSpy } = mockRenderSignTransactionUI();

    const request: SignTransactionParams = {
      chainId: network.chainId as constants.StarknetChainId,
      address: account.address,
      transactions: transactionExample.transactions,
      transactionsDetail:
        transactionExample.transactionsDetail as unknown as InvocationsSignerDetails,
      enableAuthorize,
    };

    if (enableAuthorize) {
      request.enableAuthorize = enableAuthorize;
    }
    return {
      request,
      account,
      confirmDialogSpy,
    };
  };

  it('signs a transaction correctly', async () => {
    const { request, account } = await setupSignTransactionTest();

    const expectedResult = await starknetUtils.signTransactions(
      account.privateKey,
      request.transactions,
      request.transactionsDetail,
    );

    const result = await signTransaction.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const { request, account, confirmDialogSpy } =
      await setupSignTransactionTest(true);

    await signTransaction.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledWith({
      senderAddress: account.address,
      chainId: network.chainId as constants.StarknetChainId,
      networkName: STARKNET_SEPOLIA_TESTNET_NETWORK.name,
      transactions: request.transactions,
    });
  });

  it('throws `UserRejectedOpError` if user denied the operation', async () => {
    const { request, confirmDialogSpy } = await setupSignTransactionTest(true);
    confirmDialogSpy.mockResolvedValue(false);

    await expect(signTransaction.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      signTransaction.execute({} as unknown as SignTransactionParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
