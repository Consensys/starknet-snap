import type { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import {
  InvalidParamsError,
  SnapError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import { constants } from 'starknet';

import type { StarknetAccount } from '../../test/utils';
import { generateAccounts } from '../../test/utils';
import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import * as keyPairUtils from '../utils/keyPair';
import * as snapHelper from '../utils/snap';
import * as snapUtils from '../utils/snapUtils';
import * as starknetUtils from '../utils/starknetUtils';
import { displayPrivateKey } from './displayPrivateKey';
import type { DisplayPrivateKeyParams } from './displayPrivateKey';

jest.mock('../utils/snap');
jest.mock('../utils/logger');
jest.mock('../utils/keyPair');

describe('DisplayPrivateKeyRpc', () => {
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

  const prepareDisplayPrivateKeyMock = async (account: StarknetAccount) => {
    const getStateDataSpy = jest.spyOn(snapHelper, 'getStateData');
    const verifyIfAccountNeedUpgradeOrDeploySpy = jest.spyOn(
      snapUtils,
      'verifyIfAccountNeedUpgradeOrDeploy',
    );
    const getKeysFromAddressSpy = jest.spyOn(
      starknetUtils,
      'getKeysFromAddress',
    );
    const confirmDialogSpy = jest.spyOn(snapHelper, 'confirmDialog');
    const alertDialogSpy = jest.spyOn(snapHelper, 'alertDialog');
    const getAddressKeyDeriverSpy = jest.spyOn(
      keyPairUtils,
      'getAddressKeyDeriver',
    );

    getKeysFromAddressSpy.mockResolvedValue({
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      addressIndex: account.addressIndex,
      derivationPath: account.derivationPath as unknown as any,
    });
    verifyIfAccountNeedUpgradeOrDeploySpy.mockReturnThis();
    confirmDialogSpy.mockResolvedValue(true);
    alertDialogSpy.mockResolvedValue(true);
    getStateDataSpy.mockResolvedValue(state);
    const keyDeriverMock = {
      path: "m / bip32:44' / bip32:60' / bip32:0' / bip32:0",
      coin_type: 9004, // eslint-disable-line @typescript-eslint/naming-convention
      derive: async (
        address_index: number, // eslint-disable-line
      ): Promise<any> => {
        return {
          privateKey: 'mockPrivateKey',
          publicKey: 'mockPublicKey',
          addressIndex: address_index, // eslint-disable-line
        };
      },
    } as unknown as BIP44AddressKeyDeriver;
    getAddressKeyDeriverSpy.mockResolvedValue(keyDeriverMock);

    return {
      getKeysFromAddressSpy,
      confirmDialogSpy,
      alertDialogSpy,
      getAddressKeyDeriverSpy,
      verifyIfAccountNeedUpgradeOrDeploySpy,
    };
  };

  it('displays private key correctly when the user confirms', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    const { alertDialogSpy } = await prepareDisplayPrivateKeyMock(account);

    const request: DisplayPrivateKeyParams = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
    };

    const result = await displayPrivateKey.execute(request);

    expect(result).toBeNull();
    expect(alertDialogSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'text',
        value: 'Starknet Account Private Key',
      }),
      expect.objectContaining({ type: 'copyable', value: account.privateKey }),
    ]);
  });

  it('throws `UserRejectedRequestError` if user denies the operation', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    const { confirmDialogSpy } = await prepareDisplayPrivateKeyMock(account);

    confirmDialogSpy.mockResolvedValue(false);

    const request: DisplayPrivateKeyParams = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
    };

    await expect(displayPrivateKey.execute(request)).rejects.toThrow(
      UserRejectedRequestError,
    );
  });

  it('throws `InvalidParamsError` when request parameters are not correct', async () => {
    await expect(
      displayPrivateKey.execute({} as unknown as DisplayPrivateKeyParams),
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should throw an error if the user address is undefined', async () => {
    await expect(
      displayPrivateKey.execute({
        chainId: constants.StarknetChainId.SN_SEPOLIA,
      } as DisplayPrivateKeyParams),
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should throw an error if the user address is invalid', async () => {
    await expect(
      displayPrivateKey.execute({
        chainId: constants.StarknetChainId.SN_SEPOLIA,
        address: 'invalid_address',
      } as DisplayPrivateKeyParams),
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should throw error if validateAccountRequireUpgradeOrDeploy fails', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    const { verifyIfAccountNeedUpgradeOrDeploySpy } =
      await prepareDisplayPrivateKeyMock(account);

    verifyIfAccountNeedUpgradeOrDeploySpy.mockRejectedValue(
      new SnapError('Upgrade required'),
    );

    const request: DisplayPrivateKeyParams = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
    };

    await expect(displayPrivateKey.execute(request)).rejects.toThrow(
      'Upgrade required',
    );
  });

  it('should throw error if getKeysFromAddress failed', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    const { getKeysFromAddressSpy } = await prepareDisplayPrivateKeyMock(
      account,
    );

    getKeysFromAddressSpy.mockRejectedValue(
      new SnapError('Failed to get keys'),
    );

    const request: DisplayPrivateKeyParams = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
    };

    await expect(displayPrivateKey.execute(request)).rejects.toThrow(
      'Failed to get keys',
    );
  });
});
