import {
  InvalidParamsError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { DeclareSignerDetails } from 'starknet';
import { constants } from 'starknet';

import type { SnapState } from '../types/snapState';
import { toJson } from '../utils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import * as starknetUtils from '../utils/starknetUtils';
import {
  mockAccount,
  prepareMockAccount,
  prepareConfirmDialog,
} from './__tests__/helper';
import { signDeclareTransaction } from './sign-declare-transaction';
import type { SignDeclareTransactionParams } from './sign-declare-transaction';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('signDeclareTransaction', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const createRequest = (
    chainId: constants.StarknetChainId,
    address: string,
  ) => ({
    details: {
      classHash:
        '0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
      senderAddress: address,
      chainId,
      version: constants.TRANSACTION_VERSION.V1,
      maxFee: 0,
      nonce: 0,
    },
    address,
    chainId,
  });

  it('signs message correctly', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);

    prepareMockAccount(account, state);
    prepareConfirmDialog();

    const request = createRequest(chainId, account.address);

    const expectedResult = await starknetUtils.signDeclareTransaction(
      account.privateKey,
      request.details as unknown as DeclareSignerDetails,
    );

    const result = await signDeclareTransaction.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);

    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();

    const request = createRequest(chainId, account.address);

    await signDeclareTransaction.execute(request);

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
        label: 'Declare Transaction Details',
        value: {
          value: toJson(request.details),
          markdown: false,
          type: 'text',
        },
      },
    ]);
  });

  it('throws `UserRejectedRequestError` if user denied the operation', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);

    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();

    confirmDialogSpy.mockResolvedValue(false);

    const request = createRequest(chainId, account.address);

    await expect(signDeclareTransaction.execute(request)).rejects.toThrow(
      UserRejectedRequestError,
    );
  });

  it('throws `InvalidParamsError` when request parameter is not correct', async () => {
    await expect(
      signDeclareTransaction.execute(
        {} as unknown as SignDeclareTransactionParams,
      ),
    ).rejects.toThrow(InvalidParamsError);
  });
});
