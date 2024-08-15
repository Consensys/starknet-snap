import {
  InvalidParamsError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import { constants } from 'starknet';

import type { StarknetAccount } from '../../test/utils';
import { generateAccounts } from '../../test/utils';
import typedDataExample from '../__tests__/fixture/typedDataExample.json';
import type { SnapState } from '../types/snapState';
import { toJson } from '../utils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import * as snapHelper from '../utils/snap';
import * as snapUtils from '../utils/snapUtils';
import * as starknetUtils from '../utils/starknetUtils';
import { signMessage } from './signMessage';
import type { SignMessageParams } from './signMessage';

jest.mock('./utils/snap');
jest.mock('./utils/logger');

describe('signMessage', () => {
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

  const prepareSignMessageMock = async (account: StarknetAccount) => {
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

    getKeysFromAddressSpy.mockResolvedValue({
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      addressIndex: account.addressIndex,
      derivationPath: account.derivationPath as unknown as any,
    });

    verifyIfAccountNeedUpgradeOrDeploySpy.mockReturnThis();
    confirmDialogSpy.mockResolvedValue(true);
    getStateDataSpy.mockResolvedValue(state);

    return {
      getKeysFromAddressSpy,
      verifyIfAccountNeedUpgradeOrDeploySpy,
      confirmDialogSpy,
    };
  };

  it('signs message correctly', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    await prepareSignMessageMock(account);

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

    const { confirmDialogSpy } = await prepareSignMessageMock(account);

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

    const { confirmDialogSpy } = await prepareSignMessageMock(account);

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
