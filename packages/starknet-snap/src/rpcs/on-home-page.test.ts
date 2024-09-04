import { ethers } from 'ethers';
import { constants } from 'starknet';

import { generateAccounts, type StarknetAccount } from '../__tests__/helper';
import type { Network, SnapState } from '../types/snapState';
import {
  BlockIdentifierEnum,
  ETHER_MAINNET,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../utils/constants';
import * as snapHelper from '../utils/snap';
import * as starknetUtils from '../utils/starknetUtils';
import { HomePageController } from './on-home-page';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('homepageController', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
    currentNetwork: STARKNET_SEPOLIA_TESTNET_NETWORK,
  };

  const mockAccount = async (chainId: constants.StarknetChainId) => {
    return (await generateAccounts(chainId, 1))[0];
  };

  const mockState = async () => {
    const getStateDataSpy = jest.spyOn(snapHelper, 'getStateData');
    getStateDataSpy.mockResolvedValue(state);
    return {
      getStateDataSpy,
    };
  };

  class MockHomePageController extends HomePageController {
    async getAddress(network: Network): Promise<string> {
      return super.getAddress(network);
    }

    async getBalance(network: Network, address: string): Promise<string> {
      return super.getBalance(network, address);
    }
  }

  describe('execute', () => {
    const prepareExecuteMock = (account: StarknetAccount, balance: string) => {
      const getAddressSpy = jest.spyOn(
        MockHomePageController.prototype,
        'getAddress',
      );
      const getBalanceSpy = jest.spyOn(
        MockHomePageController.prototype,
        'getBalance',
      );
      getAddressSpy.mockResolvedValue(account.address);
      getBalanceSpy.mockResolvedValue(balance);
      return {
        getAddressSpy,
        getBalanceSpy,
      };
    };

    it('returns the correct homepage response', async () => {
      const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
      await mockState();
      const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
      const balance = '100';

      const { getAddressSpy, getBalanceSpy } = prepareExecuteMock(
        account,
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
                value: network.name,
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
      expect(getAddressSpy).toHaveBeenCalledWith(network);
      expect(getBalanceSpy).toHaveBeenCalledWith(network, account.address);
    });

    it('throws `Failed to initialize Snap HomePage` error if an error was thrown', async () => {
      await mockState();
      const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
      const balance = '100';

      const { getAddressSpy } = prepareExecuteMock(account, balance);
      getAddressSpy.mockReset().mockRejectedValue(new Error('error'));

      const homepageController = new MockHomePageController();
      await expect(homepageController.execute()).rejects.toThrow(
        'Failed to initialize Snap HomePage',
      );
    });
  });

  describe('getAddress', () => {
    const prepareGetAddressMock = async (account: StarknetAccount) => {
      const getKeysFromAddressSpy = jest.spyOn(
        starknetUtils,
        'getKeysFromAddressIndex',
      );

      getKeysFromAddressSpy.mockResolvedValue({
        privateKey: account.privateKey,
        publicKey: account.publicKey,
        addressIndex: account.addressIndex,
        derivationPath: account.derivationPath as unknown as any,
      });

      const getCorrectContractAddressSpy = jest.spyOn(
        starknetUtils,
        'getCorrectContractAddress',
      );
      getCorrectContractAddressSpy.mockResolvedValue({
        address: account.address,
        signerPubKey: account.publicKey,
        upgradeRequired: false,
        deployRequired: false,
      });
      return {
        getKeysFromAddressSpy,
        getCorrectContractAddressSpy,
      };
    };

    it('returns the correct homepage response', async () => {
      const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
      await mockState();
      const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
      const { getKeysFromAddressSpy, getCorrectContractAddressSpy } =
        await prepareGetAddressMock(account);

      const homepageController = new MockHomePageController();
      const result = await homepageController.getAddress(network);

      expect(result).toStrictEqual(account.address);
      expect(getKeysFromAddressSpy).toHaveBeenCalledWith(
        // BIP44 Deriver has mocked as undefined, hence this argument should be undefined
        undefined,
        network.chainId,
        state,
        0,
      );
      expect(getCorrectContractAddressSpy).toHaveBeenCalledWith(
        network,
        account.publicKey,
      );
    });
  });

  describe('getBalance', () => {
    const prepareGetBalanceMock = async (
      latestVal: number,
      pendingVal: number,
    ) => {
      const getBalanceSpy = jest.spyOn(starknetUtils, 'getBalance');

      getBalanceSpy.mockResolvedValueOnce(latestVal.toString(16));
      getBalanceSpy.mockResolvedValue(pendingVal.toString(16));

      return {
        getBalanceSpy,
      };
    };

    it.each([
      {
        latestBalance: 1,
        pendingBalance: 2,
        expectedBalance: 1,
        title: {
          blockIdentifier1: 'latest',
          blockIdentifier2: 'pending',
        },
      },
      {
        latestBalance: 2,
        pendingBalance: 1,
        expectedBalance: 1,
        title: {
          blockIdentifier1: 'pending',
          blockIdentifier2: 'latest',
        },
      },
    ])(
      'returns the balance on $title.blockIdentifier1 block if it is smaller than the balance on $title.blockIdentifier2 block',
      async ({
        latestBalance,
        pendingBalance,
        expectedBalance,
      }: {
        latestBalance: number;
        pendingBalance: number;
        expectedBalance: number;
      }) => {
        const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
        // as we only accept mainnet / sepolia testnet, and ETH token address are same across all networks
        // hence we can hardcode the token
        const token = ETHER_MAINNET;
        await mockState();
        const { address } = await mockAccount(
          constants.StarknetChainId.SN_SEPOLIA,
        );
        const { getBalanceSpy } = await prepareGetBalanceMock(
          latestBalance,
          pendingBalance,
        );

        const homepageController = new MockHomePageController();
        const result = await homepageController.getBalance(network, address);

        expect(result).toStrictEqual(
          ethers.utils.formatUnits(
            ethers.BigNumber.from(expectedBalance.toString(16)),
            token.decimals,
          ),
        );
        expect(getBalanceSpy).toHaveBeenCalledTimes(2);
        expect(getBalanceSpy).toHaveBeenCalledWith(
          address,
          token.address,
          network,
          BlockIdentifierEnum.Latest,
        );
        expect(getBalanceSpy).toHaveBeenCalledWith(
          address,
          token.address,
          network,
          BlockIdentifierEnum.Pending,
        );
      },
    );
  });
});
