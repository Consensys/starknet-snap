import type { constants } from 'starknet';

import { AccountStateManager } from '../state/account-state-manager';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import { setupAccountController } from './__tests__/helper';
import { getCurrentAccount } from './get-current-account';
import type { GetCurrentAccountParams } from './get-current-account';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('GetCurrentAccountRpc', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupGetCurrentAccountTest = async () => {
    // Although `GetCurrentAccountRpc` does not inherit `AccountRpcController`,
    // but we can still use `setupAccountController` to mock the `AccountService`.
    const { account, deriveAccountByIndexSpy } = await setupAccountController(
      {},
    );

    const getCurrentAccountSpy = jest.spyOn(
      AccountStateManager.prototype,
      'getCurrentAccount',
    );
    getCurrentAccountSpy.mockResolvedValue(await account.serialize());

    const request = {
      chainId: network.chainId as unknown as constants.StarknetChainId,
    };

    return {
      getCurrentAccountSpy,
      deriveAccountByIndexSpy,
      account,
      request,
    };
  };

  it('returns the selected `Account`', async () => {
    const { account, request, deriveAccountByIndexSpy } =
      await setupGetCurrentAccountTest();

    const result = await getCurrentAccount.execute(request);

    expect(result).toStrictEqual(await account.serialize());
    expect(deriveAccountByIndexSpy).toHaveBeenCalled();
  });

  it('returns the selected `Account` from state if the param `fromState` was given', async () => {
    const { account, request, deriveAccountByIndexSpy } =
      await setupGetCurrentAccountTest();

    const result = await getCurrentAccount.execute({
      ...request,
      fromState: true,
    });

    expect(result).toStrictEqual(await account.serialize());
    expect(deriveAccountByIndexSpy).not.toHaveBeenCalled();
  });

  it('derives the selected `Account` if the param `fromState` was given but the account does not found from state', async () => {
    const { account, request, deriveAccountByIndexSpy, getCurrentAccountSpy } =
      await setupGetCurrentAccountTest();
    getCurrentAccountSpy.mockResolvedValue(null);

    const result = await getCurrentAccount.execute({
      ...request,
      fromState: true,
    });

    expect(result).toStrictEqual(await account.serialize());
    expect(deriveAccountByIndexSpy).toHaveBeenCalled();
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      getCurrentAccount.execute({} as unknown as GetCurrentAccountParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
