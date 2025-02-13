import type { constants } from 'starknet';

import { mockAccountStateManager } from '../state/__tests__/helper';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import { AccountService } from '../wallet/account';
import {
  createAccountObject,
  mockAccountContractReader,
} from '../wallet/account/__test__/helper';
import { getCurrentAccount } from './get-current-account';
import type { GetCurrentAccountParams } from './get-current-account';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('GetCurrentAccountRpc', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupGetCurrentAccountTest = async () => {
    const { accountObj } = await createAccountObject(network);

    mockAccountContractReader({});

    const { getCurrentAccountSpy } = mockAccountStateManager();
    getCurrentAccountSpy.mockResolvedValue(await accountObj.serialize());

    const getCurrentAccountServiceSpy = jest.spyOn(
      AccountService.prototype,
      'getCurrentAccount',
    );
    getCurrentAccountServiceSpy.mockResolvedValue(accountObj);

    const request = {
      chainId: network.chainId as unknown as constants.StarknetChainId,
    };

    return {
      getCurrentAccountSpy,
      getCurrentAccountServiceSpy,
      account: accountObj,
      request,
    };
  };

  it('returns the selected `Account`', async () => {
    const { account, request, getCurrentAccountServiceSpy } =
      await setupGetCurrentAccountTest();

    const result = await getCurrentAccount.execute(request);

    expect(result).toStrictEqual(await account.serialize());
    expect(getCurrentAccountServiceSpy).toHaveBeenCalled();
  });

  it('returns the selected `Account` from state if the param `fromState` was given', async () => {
    const { account, request, getCurrentAccountServiceSpy } =
      await setupGetCurrentAccountTest();

    const result = await getCurrentAccount.execute({
      ...request,
      fromState: true,
    });

    expect(result).toStrictEqual(await account.serialize());
    expect(getCurrentAccountServiceSpy).not.toHaveBeenCalled();
  });

  it('derives the selected `Account` if the param `fromState` was given but the account does not found from state', async () => {
    const {
      account,
      request,
      getCurrentAccountServiceSpy,
      getCurrentAccountSpy,
    } = await setupGetCurrentAccountTest();
    getCurrentAccountSpy.mockResolvedValue(null);

    const result = await getCurrentAccount.execute({
      ...request,
      fromState: true,
    });

    expect(result).toStrictEqual(await account.serialize());
    expect(getCurrentAccountServiceSpy).toHaveBeenCalled();
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      getCurrentAccount.execute({} as unknown as GetCurrentAccountParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
