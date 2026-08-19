import { ethers } from 'ethers';

import { HomePageController } from './on-home-page';
import { setupAccountController } from './rpcs/__tests__/helper';
import type { Network } from './types/snapState';
import {
  BlockIdentifierEnum,
  ETHER_MAINNET,
  STARKNET_MAINNET_NETWORK,
} from './utils/constants';
import { loadLocale } from './utils/locale';
import * as starknetUtils from './utils/starknetUtils';

jest.mock('./utils/snap');
jest.mock('./utils/logger');

describe('homepageController', () => {
  const currentNetwork = STARKNET_MAINNET_NETWORK;

  class MockHomePageController extends HomePageController {
    async getBalance(network: Network, address: string): Promise<string> {
      return super.getBalance(network, address);
    }
  }

  describe('execute', () => {
    const setupExecuteTest = async (
      network: Network,
      balance = '1000',
      { isDeployed = true, requireDeploy = false } = {},
    ) => {
      const { account, isDeploySpy, isRequireDeploySpy } =
        await setupAccountController({
          network,
          isDeployed,
          requireDeploy,
        });

      const getBalanceSpy = jest.spyOn(
        MockHomePageController.prototype,
        'getBalance',
      );
      getBalanceSpy.mockResolvedValue(balance);

      return {
        account,
        getBalanceSpy,
        isDeploySpy,
        isRequireDeploySpy,
      };
    };

    it('returns the correct homepage response', async () => {
      await loadLocale();
      const balance = '100';

      const { getBalanceSpy, account } = await setupExecuteTest(
        currentNetwork,
        balance,
      );

      const homepageController = new MockHomePageController();
      const result = await homepageController.execute();

      expect(result).toStrictEqual({
        content: {
          children: [
            {
              type: 'text',
              value: 'Address',
            },
            {
              type: 'copyable',
              value: account.address,
            },
            {
              label: 'Network',
              type: 'row',
              value: {
                type: 'text',
                value: currentNetwork?.name,
              },
            },
            {
              label: 'Balance',
              type: 'row',
              value: {
                type: 'text',
                value: `${balance} ETH`,
              },
            },
            {
              type: 'divider',
            },
            {
              type: 'text',
              value:
                'Visit the [companion dapp for Starknet](https://snaps.consensys.io/starknet) to manage your account.',
            },
          ],
          type: 'panel',
        },
      });
      expect(getBalanceSpy).toHaveBeenCalledWith(
        currentNetwork,
        account.address,
      );
    });

    const deprecationHomepage = {
      content: {
        children: [
          {
            type: 'heading',
            value: 'New accounts are no longer supported.',
          },
          {
            type: 'text',
            value:
              'Looking for a Starknet wallet? Find other options at [starknet.io/wallets](https://www.starknet.io/wallets)',
          },
        ],
        type: 'panel',
      },
    };

    it('returns the deprecation notice and does not include the address if the account is not deployed', async () => {
      await loadLocale();

      const { getBalanceSpy, account } = await setupExecuteTest(
        currentNetwork,
        '100',
        {
          isDeployed: false,
        },
      );

      const homepageController = new MockHomePageController();
      const result = await homepageController.execute();

      expect(result).toStrictEqual(deprecationHomepage);
      expect(JSON.stringify(result)).not.toContain(account.address);
      expect(getBalanceSpy).not.toHaveBeenCalled();
    });

    it('returns the deprecation notice if the account requires deploy', async () => {
      await loadLocale();

      const { getBalanceSpy } = await setupExecuteTest(currentNetwork, '100', {
        isDeployed: true,
        requireDeploy: true,
      });

      const homepageController = new MockHomePageController();
      const result = await homepageController.execute();

      expect(result).toStrictEqual(deprecationHomepage);
      expect(getBalanceSpy).not.toHaveBeenCalled();
    });

    it('returns the deprecation notice if the deployment check fails', async () => {
      await loadLocale();

      const { getBalanceSpy, isDeploySpy } = await setupExecuteTest(
        currentNetwork,
        '100',
      );
      isDeploySpy.mockReset().mockRejectedValue(new Error('rpc error'));

      const homepageController = new MockHomePageController();
      const result = await homepageController.execute();

      expect(result).toStrictEqual(deprecationHomepage);
      expect(getBalanceSpy).not.toHaveBeenCalled();
    });

    it('throws `Failed to initialize Snap HomePage` error if an error was thrown', async () => {
      const { getBalanceSpy } = await setupExecuteTest(currentNetwork);
      getBalanceSpy.mockReset().mockRejectedValue(new Error('error'));

      const homepageController = new MockHomePageController();
      await expect(homepageController.execute()).rejects.toThrow(
        'Failed to initialize Snap HomePage',
      );
    });
  });

  describe('getBalance', () => {
    const setupGetBalanceTest = async (network: Network, balance: number) => {
      const { account } = await setupAccountController({ network });

      const getBalanceSpy = jest.spyOn(starknetUtils, 'getBalance');

      getBalanceSpy.mockResolvedValue(balance.toString(16));

      return {
        account,
        getBalanceSpy,
      };
    };

    it('returns the balance on pending block', async () => {
      const token = ETHER_MAINNET;
      const expectedBalance = 100;
      const { getBalanceSpy, account } = await setupGetBalanceTest(
        currentNetwork,
        expectedBalance,
      );

      const homepageController = new MockHomePageController();
      const result = await homepageController.getBalance(
        currentNetwork,
        account.address,
      );

      expect(result).toStrictEqual(
        ethers.utils.formatUnits(
          ethers.BigNumber.from(expectedBalance.toString(16)),
          token.decimals,
        ),
      );
      expect(getBalanceSpy).toHaveBeenCalledWith(
        account.address,
        token.address,
        currentNetwork,
        BlockIdentifierEnum.Pending,
      );
    });
  });
});
