import type { constants } from 'starknet';

import { AccountStateManager } from '../state/account-state-manager';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import { listAccounts } from './list-accounts';
import type { ListAccountsParams } from './list-accounts';
import { generateAccounts } from '../__tests__/helper';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('ListAccountsRpc', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupListAccountsTest = async () => {
    const accounts = await generateAccounts(network.chainId, 10)

    const listAccountsSpy = jest.spyOn(
      AccountStateManager.prototype,
      'findAccounts',
    );
    listAccountsSpy.mockResolvedValue(accounts);

    const request = {
      chainId: network.chainId as unknown as constants.StarknetChainId,
    };

    return {
      listAccountsSpy,
      accounts,
      request,
    };
  };

  it('returns an array of `Account`', async () => {
    const { accounts, request , listAccountsSpy } =
      await setupListAccountsTest();

    const result = await listAccounts.execute(request);

    expect(result).toStrictEqual(accounts );
    expect(listAccountsSpy).toHaveBeenCalledWith({
      chainId: network.chainId,
    });
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      listAccounts.execute({} as unknown as ListAccountsParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
