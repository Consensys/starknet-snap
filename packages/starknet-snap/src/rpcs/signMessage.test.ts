import {
  InvalidParamsError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import { constants } from 'starknet';

import typedDataExample from '../__tests__/fixture/typedDataExample.json';
import type { SnapState } from '../types/snapState';
import { toJson } from '../utils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import * as starknetUtils from '../utils/starknetUtils';
import {
  mockAccount,
  prepareMockAccount,
  prepareSignConfirmDialog,
} from './__tests__/helper';
import { signMessage } from './signMessage';
import type { SignMessageParams } from './signMessage';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('signMessage', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  it('signs message correctly', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    prepareSignConfirmDialog();

    const expectedResult = await starknetUtils.signMessage(
      account.privateKey,
      typedDataExample,
      account.address,
    );

    const request = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      typedDataMessage: typedDataExample,
    };
    const result = await signMessage.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareSignConfirmDialog();

    const request = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      typedDataMessage: typedDataExample,
      enableAuthorize: true,
    };

    await signMessage.execute(request);

    const calls = confirmDialogSpy.mock.calls[0][0];
    expect(calls).toStrictEqual([
      { type: 'heading', value: 'Do you want to sign this message?' },
      {
        type: 'row',
        label: 'Message',
        value: {
          value: toJson(typedDataExample),
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
    ]);
  });

  it('throws `UserRejectedRequestError` if user denied the operation', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareSignConfirmDialog();

    confirmDialogSpy.mockResolvedValue(false);

    const request = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      typedDataMessage: typedDataExample,
      enableAuthorize: true,
    };

    await expect(signMessage.execute(request)).rejects.toThrow(
      UserRejectedRequestError,
    );
  });

  it('throws `InvalidParamsError` when request parameter is not correct', async () => {
    await expect(
      signMessage.execute({} as unknown as SignMessageParams),
    ).rejects.toThrow(InvalidParamsError);
  });
});
