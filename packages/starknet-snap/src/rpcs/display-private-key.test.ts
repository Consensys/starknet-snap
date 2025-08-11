import { constants } from 'starknet';

import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import { loadLocale } from '../utils/locale';
import { createAccountObject } from '../wallet/account/__test__/helper';
import {
  setupAccountController,
  mockRenderDisplayPrivateKeyAlertUI,
  mockRenderDisplayPrivateKeyConfirmUI,
} from './__tests__/helper';
import { displayPrivateKey } from './display-private-key';
import type { DisplayPrivateKeyParams } from './display-private-key';

jest.mock('../utils/logger');

describe('displayPrivateKey', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
  const setupDisplayPrivateKeyTest = async () => {
    const { chainId } = network;
    const { accountObj: account } = await createAccountObject(network);
    await setupAccountController({
      accountObj: account,
    });

    const { confirmDialogSpy } = mockRenderDisplayPrivateKeyConfirmUI();
    const { alertDialogSpy } = mockRenderDisplayPrivateKeyAlertUI();

    mockRenderDisplayPrivateKeyAlertUI();

    const request: DisplayPrivateKeyParams = {
      chainId: chainId as constants.StarknetChainId,
      address: account.address,
    };

    return {
      request,
      account,
      chainId,
      confirmDialogSpy,
      alertDialogSpy,
    };
  };

  it('displays private key correctly', async () => {
    await loadLocale();
    const { account, alertDialogSpy, request } =
      await setupDisplayPrivateKeyTest();

    await displayPrivateKey.execute(request);

    expect(alertDialogSpy).toHaveBeenCalledWith(account.privateKey);
  });

  it('renders confirmation dialog', async () => {
    const { confirmDialogSpy, request } = await setupDisplayPrivateKeyTest();

    await displayPrivateKey.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledTimes(1);
  });

  it('throws `UserRejectedOpError` if user denies the operation', async () => {
    const { confirmDialogSpy, request } = await setupDisplayPrivateKeyTest();

    confirmDialogSpy.mockResolvedValue(false);

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
