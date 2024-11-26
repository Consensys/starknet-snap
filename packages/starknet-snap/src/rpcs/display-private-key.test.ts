import { constants } from 'starknet';

import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import {
  mockAccount,
  prepareMockAccount,
  prepareRenderDisplayPrivateKeyAlertUI,
  prepareRenderDisplayPrivateKeyConfirmUI,
} from './__tests__/helper';
import { displayPrivateKey } from './display-private-key';
import type { DisplayPrivateKeyParams } from './display-private-key';

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
    prepareRenderDisplayPrivateKeyConfirmUI();
    const { alertDialogSpy } = prepareRenderDisplayPrivateKeyAlertUI();

    const request = createRequestParam(chainId, account.address);

    await displayPrivateKey.execute(request);

    expect(alertDialogSpy).toHaveBeenCalledWith(account.privateKey);
  });

  it('renders confirmation dialog', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareRenderDisplayPrivateKeyConfirmUI();
    prepareRenderDisplayPrivateKeyAlertUI();

    const request = createRequestParam(chainId, account.address);

    await displayPrivateKey.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledTimes(1);
  });

  it('throws `UserRejectedOpError` if user denies the operation', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareRenderDisplayPrivateKeyConfirmUI();
    prepareRenderDisplayPrivateKeyAlertUI();

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
    'throws `InvalidRequestParamsError` when $case',
    async ({ request }: { request: unknown }) => {
      await expect(
        displayPrivateKey.execute(request as DisplayPrivateKeyParams),
      ).rejects.toThrow(InvalidRequestParamsError);
    },
  );
});
