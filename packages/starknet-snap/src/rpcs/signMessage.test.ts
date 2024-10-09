import { constants } from 'starknet';

import typedDataExample from '../__tests__/fixture/typedDataExample.json';
import type { SnapState } from '../types/snapState';
import { toJson } from '../utils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import {
  mockAccount,
  prepareMockAccount,
  prepareConfirmDialog,
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
    prepareConfirmDialog();

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
    const { confirmDialogSpy } = prepareConfirmDialog();

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

  it('throws `UserRejectedOpError` if user denied the operation', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();

    confirmDialogSpy.mockResolvedValue(false);

    const request = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      typedDataMessage: typedDataExample,
      enableAuthorize: true,
    };

    await expect(signMessage.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      signMessage.execute({} as unknown as SignMessageParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
