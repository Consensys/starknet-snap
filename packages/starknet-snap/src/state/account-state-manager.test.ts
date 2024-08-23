import { constants } from 'starknet';

import { mockAcccounts, mockState } from './__tests__/helper';
import {
  AddressFilter,
  ChainIdFilter,
  AccountStateManager,
} from './account-state-manager';

describe('AccountStateManager', () => {
  describe('getAccount', () => {
    it('returns the account', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const accountsInTestnet = await mockAcccounts(chainId);
      const accountsInMainnet = await mockAcccounts(
        constants.StarknetChainId.SN_MAIN,
      );
      await mockState({
        accounts: [...accountsInTestnet, ...accountsInMainnet],
      });

      const stateManager = new AccountStateManager();
      const result = await stateManager.getAccount({
        address: accountsInTestnet[0].address,
        chainId,
      });

      expect(result).toStrictEqual(accountsInTestnet[0]);
    });

    it('returns null if the account address can not be found', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const [accountNotExist, ...accounts] = await mockAcccounts(chainId);
      await mockState({
        accounts,
      });

      const stateManager = new AccountStateManager();
      const result = await stateManager.getAccount({
        address: accountNotExist.address,
        chainId,
      });

      expect(result).toBeNull();
    });

    it('returns null if the account chainId is not match', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const accounts = await mockAcccounts(chainId);
      await mockState({
        accounts,
      });

      const stateManager = new AccountStateManager();
      const result = await stateManager.getAccount({
        address: accounts[0].address,
        chainId: constants.StarknetChainId.SN_MAIN,
      });

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('returns the list of account', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const accountsInTestnet = await mockAcccounts(chainId);
      const accountsInMainnet = await mockAcccounts(
        constants.StarknetChainId.SN_MAIN,
      );
      await mockState({
        accounts: [...accountsInTestnet, ...accountsInMainnet],
      });
      const stateManager = new AccountStateManager();
      const result = await stateManager.list([
        new AddressFilter([
          accountsInTestnet[0].address,
          accountsInMainnet[0].address,
        ]),
      ]);

      expect(result).toStrictEqual([
        accountsInTestnet[0],
        accountsInMainnet[0],
      ]);
    });

    it('returns empty array if the account address can not be found', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const [accountNotExist, ...accounts] = await mockAcccounts(chainId);
      await mockState({
        accounts,
      });

      const stateManager = new AccountStateManager();
      const result = await stateManager.list([
        new AddressFilter([accountNotExist.address]),
        new ChainIdFilter([chainId]),
      ]);

      expect(result).toStrictEqual([]);
    });
  });

  describe('updateAccount', () => {
    it('updates the account', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const accounts = await mockAcccounts(chainId);
      const { state } = await mockState({
        accounts,
      });

      const stateManager = new AccountStateManager();
      const updatedAccount = { ...accounts[0], deployTxnHash: '0x1234' };
      await stateManager.updateAccount(updatedAccount);

      expect(state.accContracts?.[0]).toStrictEqual(updatedAccount);
      expect(state.accContracts?.[0].upgradeRequired).toBeUndefined();
      expect(state.accContracts?.[0].deployRequired).toBeUndefined();
    });

    it('updates upgradeRequired and deployRequired of the account', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const accounts = await mockAcccounts(chainId);
      const { state } = await mockState({
        accounts,
      });

      const stateManager = new AccountStateManager();
      const updatedAccount = {
        ...accounts[0],
        upgradeRequired: true,
        deployRequired: false,
      };
      await stateManager.updateAccount(updatedAccount);

      expect(state.accContracts?.[0]).toStrictEqual(updatedAccount);
      expect(state.accContracts?.[0].upgradeRequired).toBe(true);
      expect(state.accContracts?.[0].deployRequired).toBe(false);
    });

    it('throws `Account does not exist` error if the update account can not be found', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const [accountNotExist, ...accounts] = await mockAcccounts(chainId);
      await mockState({
        accounts,
      });

      const stateManager = new AccountStateManager();
      const account = { ...accountNotExist, deployTxnHash: '0x1234' };
      await expect(stateManager.updateAccount(account)).rejects.toThrow(
        'Account does not exist',
      );
    });
  });

  describe('addAccount', () => {
    it('add an account', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const [accountNotExist, ...accounts] = await mockAcccounts(chainId, 5);
      const { state } = await mockState({
        accounts,
      });

      const stateManager = new AccountStateManager();
      await stateManager.addAccount(accountNotExist);

      expect(state.accContracts?.length).toBe(5);
      expect(
        state.accContracts?.[state.accContracts?.length - 1],
      ).toStrictEqual(accountNotExist);
    });

    it('throws `Account already exist` error if the account is exist', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const accounts = await mockAcccounts(chainId);
      await mockState({
        accounts,
      });

      const stateManager = new AccountStateManager();

      await expect(stateManager.addAccount(accounts[0])).rejects.toThrow(
        'Account already exist',
      );
    });
  });
});
