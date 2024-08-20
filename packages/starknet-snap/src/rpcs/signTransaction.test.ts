import {
  InvalidParamsError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { InvocationsSignerDetails } from 'starknet';
import { constants } from 'starknet';

import transactionExample from '../__tests__/fixture/transactionExample.json'; // Assuming you have a similar fixture
import type { SnapState } from '../types/snapState';
import { toJson } from '../utils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import * as starknetUtils from '../utils/starknetUtils';
import {
  mockAccount,
  prepareMockAccount,
  prepareConfirmDialog,
} from './__tests__/helper';
import { signTransaction } from './signTransaction';
import type { SignTransactionParams } from './signTransaction';

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
    prepareConfirmDialog();
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
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();
    const request = createRequestParam(chainId, account.address, true);

    await signTransaction.execute(request);

    const calls = confirmDialogSpy.mock.calls[0][0];
    expect(calls).toStrictEqual([
      { type: 'heading', value: 'Do you want to sign this transaction?' },
      {
        type: 'row',
        label: 'Network',
        value: {
          value: STARKNET_SEPOLIA_TESTNET_NETWORK.name,
          markdown: false,
          type: 'text',
        },
      },
      {
        type: 'row',
        label: 'Signer Address',
        value: {
          value: account.address,
          markdown: false,
          type: 'text',
        },
      },
      {
        type: 'row',
        label: 'Transactions',
        value: {
          value: toJson(transactionExample.transactions),
          markdown: false,
          type: 'text',
        },
      },
    ]);
  });

  it('does not render the confirmation dialog if enableAuthorize is false', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();
    const request = createRequestParam(chainId, account.address, false);

    await signTransaction.execute(request);

    expect(confirmDialogSpy).not.toHaveBeenCalled();
  });

  it('throws `UserRejectedRequestError` if user denied the operation', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();
    confirmDialogSpy.mockResolvedValue(false);
    const request = createRequestParam(chainId, account.address, true);

    await expect(signTransaction.execute(request)).rejects.toThrow(
      UserRejectedRequestError,
    );
  });

  it('throws `InvalidParamsError` when request parameter is not correct', async () => {
    await expect(
      signTransaction.execute({} as unknown as SignTransactionParams),
    ).rejects.toThrow(InvalidParamsError);
  });
});
