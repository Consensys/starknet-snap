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

    const setAccountNameSpy = jest.spyOn(
      AccountStateManager.prototype,
      'setAccountName',
    );

    const getCurrentAccountSpy = jest.spyOn(
      AccountStateManager.prototype,
      'getCurrentAccount',
    );

    setAccountNameSpy.mockReturnThis();
    getCurrentAccountSpy.mockResolvedValue(await nextAccount.serialize());

    const request = {
      chainId: network.chainId as constants.StarknetChainId,
      address: account.address,
      accountName,
    };

    return {
      getCurrentAccountSpy,
      setAccountNameSpy,
      request,
      account,
      nextAccount,
    };
  };

  it('sets account name', async () => {
    const accountName = 'My Account';
    const {
      account: { address, chainId },
      nextAccount,
      request,
      setAccountNameSpy,
      getCurrentAccountSpy,
    } = await setupSetAccountNameTest(accountName);

    const result = await setAccountName.execute(request);

    expect(result).toStrictEqual(await nextAccount.serialize());
    expect(setAccountNameSpy).toHaveBeenCalledWith({
      address,
      chainId,
      accountName,
    });
    expect(getCurrentAccountSpy).toHaveBeenCalled();
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      setAccountName.execute({} as unknown as SetAccountNameParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
