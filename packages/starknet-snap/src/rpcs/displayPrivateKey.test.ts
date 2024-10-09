import { constants } from 'starknet';

import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { UserRejectedOpError, InvalidRequestError } from '../utils/exceptions';
import {
  mockAccount,
  prepareAlertDialog,
  prepareMockAccount,
  prepareConfirmDialog,
} from './__tests__/helper';
import { displayPrivateKey } from './displayPrivateKey';
import type { DisplayPrivateKeyParams } from './displayPrivateKey';

jest.mock('../utils/logger');

describe('displayPrivateKey', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const createRequestParam = (
    chainId: constants.StarknetChainId,
    address: string,
  ): DisplayPrivateKeyParams => {
    const request: DisplayPrivateKeyParams = {
      chainId,
      address,
    };
    return request;
  };

  it('displays private key correctly', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    prepareConfirmDialog();
    const { alertDialogSpy } = prepareAlertDialog();

    const request = createRequestParam(chainId, account.address);

    await displayPrivateKey.execute(request);

    expect(alertDialogSpy).toHaveBeenCalledTimes(1);

    const calls = alertDialogSpy.mock.calls[0][0];

    expect(calls).toStrictEqual([
      { type: 'text', value: 'Starknet Account Private Key' },
      { type: 'copyable', value: account.privateKey },
    ]);
  });

  it('renders confirmation dialog', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();
    prepareAlertDialog();

    const request = createRequestParam(chainId, account.address);

    await displayPrivateKey.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledTimes(1);

    const calls = confirmDialogSpy.mock.calls[0][0];

    expect(calls).toStrictEqual([
      { type: 'text', value: 'Do you want to export your private key?' },
    ]);
  });

  it('throws `UserRejectedOpError` if user denies the operation', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();
    prepareAlertDialog();

    confirmDialogSpy.mockResolvedValue(false);

    const request = createRequestParam(chainId, account.address);

    await expect(displayPrivateKey.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it.each([
    {
      case: 'user address is omitted',
      request: {
        chainId: constants.StarknetChainId.SN_SEPOLIA,
      },
    },
    {
      case: 'user address is invalid',
      request: {
        chainId: constants.StarknetChainId.SN_SEPOLIA,
        address: 'invalid_address',
      },
    },
  ])(
    'throws `InvalidRequestError` when $case',
    async ({ request }: { request: unknown }) => {
      await expect(
        displayPrivateKey.execute(request as DisplayPrivateKeyParams),
      ).rejects.toThrow(InvalidRequestError);
    },
  );
});
