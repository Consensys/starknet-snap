import type { InvocationsSignerDetails } from 'starknet';
import { constants } from 'starknet';

import transactionExample from '../__tests__/fixture/transactionExample.json'; // Assuming you have a similar fixture
import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import {
  mockAccount,
  prepareMockAccount,
  prepareRenderSignTransactionUI,
} from './__tests__/helper';
import { signTransaction } from './sign-transaction';
import type { SignTransactionParams } from './sign-transaction';

jest.mock('../utils/logger');

describe('signTransaction', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const createRequestParam = (
    chainId: constants.StarknetChainId,
    address: string,
    enableAuthorize?: boolean,
  ): SignTransactionParams => {
    const request: SignTransactionParams = {
      chainId,
      address,
      transactions: transactionExample.transactions,
      transactionsDetail:
        transactionExample.transactionsDetail as unknown as InvocationsSignerDetails,
    };
    if (enableAuthorize) {
      request.enableAuthorize = enableAuthorize;
    }
    return request;
  };

  it('signs a transaction correctly', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    prepareRenderSignTransactionUI();
    const request = createRequestParam(chainId, account.address);

    const expectedResult = await starknetUtils.signTransactions(
      account.privateKey,
      request.transactions,
      request.transactionsDetail,
    );

    const result = await signTransaction.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    const { address } = account;
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareRenderSignTransactionUI();
    const request = createRequestParam(chainId, account.address, true);

    await signTransaction.execute(request);
    expect(confirmDialogSpy).toHaveBeenCalledWith({
      senderAddress: address,
      chainId,
      networkName: STARKNET_SEPOLIA_TESTNET_NETWORK.name,
      transactions: request.transactions,
    });
  });

  it('does not render the confirmation dialog if enableAuthorize is false', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareRenderSignTransactionUI();
    const request = createRequestParam(chainId, account.address, false);

    await signTransaction.execute(request);

    expect(confirmDialogSpy).not.toHaveBeenCalled();
  });

  it('throws `UserRejectedOpError` if user denied the operation', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareRenderSignTransactionUI();
    confirmDialogSpy.mockResolvedValue(false);
    const request = createRequestParam(chainId, account.address, true);

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
