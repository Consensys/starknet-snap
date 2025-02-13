import type { constants } from 'starknet';

import { AccountStateManager } from '../state/account-state-manager';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import { createAccountObject } from '../wallet/account/__test__/helper';
import { setupAccountController } from './__tests__/helper';
import { setAccountName } from './set-account-name';
import type { SetAccountNameParams } from './set-account-name';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('SetAccountName', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupSetAccountNameTest = async (accountName = 'My Account Name') => {
    const { account } = await setupAccountController({
      network,
    });

    const { accountObj: nextAccount } = await createAccountObject(network, 1);

    const uspertAccountSpy = jest.spyOn(
      AccountStateManager.prototype,
      'upsertAccount',
    );

    const getCurrentAccountSpy = jest.spyOn(
      AccountStateManager.prototype,
      'getCurrentAccount',
    );

    uspertAccountSpy.mockReturnThis();
    getCurrentAccountSpy.mockResolvedValue(await nextAccount.serialize());

    const request = {
      chainId: network.chainId as constants.StarknetChainId,
      address: account.address,
      accountName,
    };

    return {
      getCurrentAccountSpy,
      uspertAccountSpy,
      request,
      account,
      nextAccount,
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
      uspertAccountSpy,
    } = await setupSetAccountNameTest(accountName);

    await setAccountName.execute(request);

    expect(uspertAccountSpy).toHaveBeenCalledWith({
      accountName,
      address,
      addressSalt,
      cairoVersion,
      chainId,
      publicKey,
      addressIndex: hdIndex,
      deployRequired: false,
      upgradeRequired: false,
      visibility: true,
    });
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      setAccountName.execute({} as unknown as SetAccountNameParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
