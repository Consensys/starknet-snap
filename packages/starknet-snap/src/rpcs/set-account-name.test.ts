import type { constants } from 'starknet';

import { mockAccountStateManager } from '../state/__tests__/helper';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import { AccountService } from '../wallet/account';
import {
  createAccountObject,
  mockAccountContractReader,
} from '../wallet/account/__test__/helper';
import { setAccountName } from './set-account-name';
import type { SetAccountNameParams } from './set-account-name';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('SetAccountName', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupSetAccountNameTest = async (accountName = 'My Account Name') => {
    const { accountObj: account } = await createAccountObject(network);

    mockAccountContractReader({});

    const { getAccountSpy } = mockAccountStateManager();
    getAccountSpy.mockResolvedValue(await account.serialize());

    const deriveAccountByAddressSpy = jest.spyOn(
      AccountService.prototype,
      'deriveAccountByAddress',
    );
    deriveAccountByAddressSpy.mockResolvedValue(account);

    const { updateAccountByAddressSpy } = mockAccountStateManager();

    const request = {
      chainId: network.chainId as constants.StarknetChainId,
      address: account.address,
      accountName,
    };

    return {
      updateAccountByAddressSpy,
      request,
      account,
    };
  };

  it('sets account name', async () => {
    const accountName = 'My Account';
    const {
      account: {
        address,
        addressSalt,
        chainId,
        hdIndex,
        cairoVersion,
        publicKey,
      },
      request,
      updateAccountByAddressSpy,
    } = await setupSetAccountNameTest(accountName);

    await setAccountName.execute(request);

    expect(updateAccountByAddressSpy).toHaveBeenCalledWith({
      accountName,
      address,
      addressSalt,
      cairoVersion,
      chainId,
      publicKey,
      addressIndex: hdIndex,
      deployRequired: false,
      upgradeRequired: false,
      isDeployed: true,
    });
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      setAccountName.execute({} as unknown as SetAccountNameParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
