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
  prepareSignConfirmDialog,
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

  it('signs a transaction correctly', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    prepareSignConfirmDialog();

    const expectedResult = await starknetUtils.signTransactions(
      account.privateKey,
      transactionExample.transactions,
      transactionExample.transactionsDetail as InvocationsSignerDetails,
    );

    const request: SignTransactionParams = {
      chainId,
      address: account.address,
      transactions: transactionExample.transactions,
      transactionsDetail: transactionExample.transactionsDetail,
    };
    const result = await signTransaction.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareSignConfirmDialog();

    const request = {
      chainId,
      address: account.address,
      transactions: transactionExample.transactions,
      transactionsDetail: transactionExample.transactionsDetail,
      enableAuthorize: true,
    };

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
    const { confirmDialogSpy } = prepareSignConfirmDialog();

    const expectedResult = await starknetUtils.signTransactions(
      account.privateKey,
      transactionExample.transactions,
      transactionExample.transactionsDetail as InvocationsSignerDetails,
    );

    const request: SignTransactionParams = {
      chainId,
      address: account.address,
      transactions: transactionExample.transactions,
      transactionsDetail: transactionExample.transactionsDetail,
      enableAuthorize: false,
    };

    const result = await signTransaction.execute(request);

    expect(confirmDialogSpy).not.toHaveBeenCalled();
    expect(result).toStrictEqual(expectedResult);
  });

  it('throws `UserRejectedRequestError` if user denied the operation', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareSignConfirmDialog();

    confirmDialogSpy.mockResolvedValue(false);

    const request: SignTransactionParams = {
      chainId,
      address: account.address,
      transactions: transactionExample.transactions,
      transactionsDetail: transactionExample.transactionsDetail,
      enableAuthorize: true,
    };

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
