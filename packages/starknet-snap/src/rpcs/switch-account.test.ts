import type { constants } from 'starknet';

import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import { AccountService } from '../wallet/account';
import { setupAccountController } from './__tests__/helper';
import { switchAccount } from './switch-account';
import type { SwitchAccountParams } from './switch-account';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('SwitchAccountRpc', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupSwitchAccountTest = async () => {
    const { account } = await setupAccountController({});

    const switchAccountSpy = jest.spyOn(
      AccountService.prototype,
      'switchAccount',
    );
    switchAccountSpy.mockReturnThis();

    const request = {
      chainId: network.chainId as unknown as constants.StarknetChainId,
      address: account.address,
    };

    return {
      switchAccountSpy,
      account,
      request,
    };
  };

  it('switch the current account and returns the account', async () => {
    const { account, request, switchAccountSpy } =
      await setupSwitchAccountTest();

    const result = await switchAccount.execute(request);

    expect(result).toStrictEqual(await account.serialize());
    expect(switchAccountSpy).toHaveBeenCalledWith(account);
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      switchAccount.execute({} as unknown as SwitchAccountParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
