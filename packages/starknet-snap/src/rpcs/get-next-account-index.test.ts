import { type constants } from 'starknet';

import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { AccountService } from '../wallet/account';
import { setupAccountController } from './__tests__/helper';
import { getNextAccountIndex } from './get-next-account-index';

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

  it('get next account index', async () => {
    const { request } = await setupAddAccountTest();

    const result = await getNextAccountIndex.execute(request);

    expect(result).toStrictEqual({ addressIndex: 0 });
  });
});
