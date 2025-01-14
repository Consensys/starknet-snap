import { Logger } from 'ethers/lib/utils';
import { type constants } from 'starknet';

import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import { AccountService } from '../wallet/account';
import { setupAccountController } from './__tests__/helper';
import { addAccount } from './add-account';
import type { AddAccountParams } from './add-account';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('AddAccountRpc', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupAddAccountTest = async () => {
    // Although `AddAccountRpc` does not inherit `AccountRpcController`,
    // but we can still use `setupAccountController` to mock the `AccountService`.
    const { account, deriveAccountByIndexSpy } = await setupAccountController(
      {},
    );

    const switchAccountSpy = jest.spyOn(
      AccountService.prototype,
      'switchAccount',
    );
    switchAccountSpy.mockReturnThis();

    const request = {
      chainId: network.chainId as unknown as constants.StarknetChainId,
    };

    return {
      deriveAccountByIndexSpy,
      switchAccountSpy,
      account,
      request,
    };
  };

  it('add a `Account`', async () => {
    const { account, request, deriveAccountByIndexSpy, switchAccountSpy } =
      await setupAddAccountTest();

    const result = await addAccount.execute(request);

    expect(result).toStrictEqual(await account.serialize());
    expect(deriveAccountByIndexSpy).toHaveBeenCalled();
    expect(switchAccountSpy).toHaveBeenCalledWith(network.chainId, account);
  });

  it('does not throw an error if switch account failed', async () => {
    const { account, request, switchAccountSpy } = await setupAddAccountTest();
    switchAccountSpy.mockRejectedValueOnce(
      new Error('Failed to switch account'),
    );
    const loggerSpy = jest.spyOn(Logger.prototype, 'warn');

    const result = await addAccount.execute(request);

    expect(result).toStrictEqual(await account.serialize());
    expect(loggerSpy).toHaveBeenCalled();
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      addAccount.execute({} as unknown as AddAccountParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
