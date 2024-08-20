import {
  InvalidParamsError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import { constants } from 'starknet';

import type { StarknetAccount } from '../../test/utils';
import { generateAccounts } from '../../test/utils';
import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import * as snapHelper from '../utils/snap';
import * as snapUtils from '../utils/snapUtils';
import * as starknetUtils from '../utils/starknetUtils';
import { displayPrivateKey } from './displayPrivateKey';
import type { DisplayPrivateKeyParams } from './displayPrivateKey';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('displayPrivateKey', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const mockAccount = async (network: constants.StarknetChainId) => {
    const accounts = await generateAccounts(network, 1);
    return accounts[0];
  };

  const prepareMockAccount = (
    account: StarknetAccount,
    snapState: SnapState,
  ) => {
    const getStateDataSpy = jest.spyOn(snapHelper, 'getStateData');
    const verifyIfAccountNeedUpgradeOrDeploySpy = jest.spyOn(
      snapUtils,
      'verifyIfAccountNeedUpgradeOrDeploy',
    );
    const getKeysFromAddressSpy = jest.spyOn(
      starknetUtils,
      'getKeysFromAddress',
    );

    getKeysFromAddressSpy.mockResolvedValue({
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      addressIndex: account.addressIndex,
      derivationPath: account.derivationPath as unknown as any,
    });

    verifyIfAccountNeedUpgradeOrDeploySpy.mockReturnThis();
    getStateDataSpy.mockResolvedValue(snapState);

    return {
      getKeysFromAddressSpy,
      verifyIfAccountNeedUpgradeOrDeploySpy,
    };
  };

  const prepareConfirmDialog = () => {
    const confirmDialogSpy = jest.spyOn(snapHelper, 'confirmDialog');
    confirmDialogSpy.mockResolvedValue(true);
    return {
      confirmDialogSpy,
    };
  };

  const prepareAlertDialog = () => {
    const alertDialogSpy = jest.spyOn(snapHelper, 'alertDialog');
    alertDialogSpy.mockResolvedValue(true);
    return {
      alertDialogSpy,
    };
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

  it('throws `UserRejectedRequestError` if user denies the operation', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();
    prepareAlertDialog();

    confirmDialogSpy.mockResolvedValue(false);

    const request = createRequestParam(chainId, account.address);

    await expect(displayPrivateKey.execute(request)).rejects.toThrow(
      UserRejectedRequestError,
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
  ])('throws `InvalidParamsError` when $case', async (request) => {
    await expect(
      displayPrivateKey.execute(request as unknown as DisplayPrivateKeyParams),
    ).rejects.toThrow(InvalidParamsError);
  });
});
