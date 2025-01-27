import type { constants } from 'starknet';

import { AccountStateManager } from '../state/account-state-manager';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import { createAccountObject } from '../wallet/account/__test__/helper';
import { setupAccountController } from './__tests__/helper';
import { toggleAccountVisibility } from './toggle-account-visibility';
import type { ToggleAccountVisibilityParams } from './toggle-account-visibility';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('ToggleAccountVisibility', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupToggleAccountVisibilityTest = async (visibility = false) => {
    const { account } = await setupAccountController({
      network,
    });

    const { accountObj: nextAccount } = await createAccountObject(network, 1);

    const toggleAccountVisibilitySpy = jest.spyOn(
      AccountStateManager.prototype,
      'toggleAccountVisibility',
    );

    const getCurrentAccountSpy = jest.spyOn(
      AccountStateManager.prototype,
      'getCurrentAccount',
    );

    toggleAccountVisibilitySpy.mockReturnThis();
    getCurrentAccountSpy.mockResolvedValue(await nextAccount.serialize());

    const request = {
      chainId: network.chainId as constants.StarknetChainId,
      address: account.address,
      visibility,
    };

    return {
      getCurrentAccountSpy,
      toggleAccountVisibilitySpy,
      request,
      account,
      nextAccount,
    };
  };

  it.each([true, false])(
    'toggles the account visibility - %s',
    async (visibility) => {
      const {
        account: { address, chainId },
        nextAccount,
        request,
        toggleAccountVisibilitySpy,
        getCurrentAccountSpy,
      } = await setupToggleAccountVisibilityTest(visibility);

      const result = await toggleAccountVisibility.execute(request);

      expect(result).toStrictEqual(await nextAccount.serialize());
      expect(toggleAccountVisibilitySpy).toHaveBeenCalledWith({
        address,
        chainId,
        visibility,
      });
      expect(getCurrentAccountSpy).toHaveBeenCalled();
    },
  );

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      toggleAccountVisibility.execute(
        {} as unknown as ToggleAccountVisibilityParams,
      ),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
