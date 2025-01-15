import { constants } from 'starknet';

import type { StarknetAccount } from '../__tests__/helper';
import { Config } from '../config';
import {
  generateMainnetAccounts,
  generateTestnetAccounts,
  mockState,
} from './__tests__/helper';
import { AccountStateManager } from './account-state-manager';
import { StateManagerError } from './state-manager';

describe('AccountStateManager', () => {
  const testnetChainId = constants.StarknetChainId.SN_SEPOLIA;
  const mainnetChainId = constants.StarknetChainId.SN_MAIN;

  const mockStateWithMainnetAccounts = async (
    accounts: StarknetAccount[] = [],
  ) => {
    const mainnetAccounts = await generateMainnetAccounts();

    const { state } = await mockState({
      accounts: mainnetAccounts.concat(accounts),
    });
    return state;
  };

  describe('getAccount', () => {
    it('returns the account', async () => {
      const accountsInTestnet = await generateTestnetAccounts();
      await mockStateWithMainnetAccounts(accountsInTestnet);

      const stateManager = new AccountStateManager();
      const result = await stateManager.getAccount({
        address: accountsInTestnet[0].address,
        chainId: testnetChainId,
      });

      expect(result).toStrictEqual(accountsInTestnet[0]);
    });

    it('returns null if the account address can not be found', async () => {
      const [accountNotExist, ...accounts] = await generateTestnetAccounts();
      await mockStateWithMainnetAccounts(accounts);

      const stateManager = new AccountStateManager();
      const result = await stateManager.getAccount({
        address: accountNotExist.address,
        chainId: testnetChainId,
      });

      expect(result).toBeNull();
    });

    it('returns null if the account chainId does not match', async () => {
      const accounts = await generateTestnetAccounts();
      await mockStateWithMainnetAccounts(accounts);

      const stateManager = new AccountStateManager();
      const result = await stateManager.getAccount({
        address: accounts[0].address,
        chainId: mainnetChainId,
      });

      expect(result).toBeNull();
    });
  });

  describe('findAccounts', () => {
    it('returns the list of accounts', async () => {
      const accountsInTestnet = await generateTestnetAccounts();
      const accountsInMainnet = await generateMainnetAccounts();

      await mockState({
        accounts: [...accountsInTestnet, ...accountsInMainnet],
      });
      const stateManager = new AccountStateManager();
      const result = await stateManager.findAccounts({
        chainId: testnetChainId,
      });

      expect(result).toStrictEqual(accountsInTestnet);
    });

    it('returns empty array if the account address can not be found', async () => {
      const accounts = await generateTestnetAccounts();
      await mockState({
        accounts,
      });

      const stateManager = new AccountStateManager();
      const result = await stateManager.findAccounts({
        chainId: mainnetChainId,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('upsertAccount', () => {
    it('adds an account if the account does not exist', async () => {
      const [account] = await generateTestnetAccounts(1);
      const state = await mockStateWithMainnetAccounts();
      const originalAccountsFromState = [...state.accContracts];

      const stateManager = new AccountStateManager();
      await stateManager.upsertAccount(account);

      expect(state.accContracts).toStrictEqual(
        originalAccountsFromState.concat([account]),
      );
    });

    it('updates the account if the account is found', async () => {
      const accounts = await generateTestnetAccounts();
      const updatedAccount = {
        ...accounts[0],
        upgradeRequired: true,
      };
      const state = await mockStateWithMainnetAccounts(accounts);
      const originalAccountsLength = state.accContracts.length;

      const stateManager = new AccountStateManager();
      await stateManager.upsertAccount(updatedAccount);

      expect(state.accContracts).toHaveLength(originalAccountsLength);
      expect(
        state.accContracts.find(
          (acc) =>
            acc.address === updatedAccount.address &&
            acc.chainId === updatedAccount.chainId,
        ),
      ).toStrictEqual(updatedAccount);
    });
  });

  describe('getNextIndex', () => {
    const setupGetNextIndexTest = async () => {
      const state = await mockStateWithMainnetAccounts();
      state.removedAccounts = {
        [mainnetChainId]: [0, 1, 2],
      };
      return state;
    };

    it('returns index 0 if `removedAccounts` and `accContracts` are empty for the given chainId', async () => {
      await setupGetNextIndexTest();

      const stateManager = new AccountStateManager();
      const result = await stateManager.getNextIndex(testnetChainId);

      expect(result).toBe(0);
    });

    it('returns the first index from `removedAccounts` if it is not empty for the given chainId', async () => {
      const removedAccounts = [1, 3];
      const state = await setupGetNextIndexTest();
      state.removedAccounts[testnetChainId] = removedAccounts;

      const stateManager = new AccountStateManager();
      const result = await stateManager.getNextIndex(testnetChainId);

      expect(result).toBe(1);
      // Ensure that the removed account is removed from the state
      expect(state.removedAccounts[testnetChainId]).toStrictEqual([3]);
    });

    it('returns the length of index `accContracts` if `removedAccounts` is empty for the given chainId', async () => {
      const accounts = await generateTestnetAccounts();
      const state = await setupGetNextIndexTest();
      state.accContracts = state.accContracts.concat(accounts);

      const stateManager = new AccountStateManager();
      const result = await stateManager.getNextIndex(testnetChainId);

      expect(result).toStrictEqual(accounts.length);
    });
  });

  describe('removeAccount', () => {
    it('removes an account', async () => {
      const accounts = await generateTestnetAccounts();
      const removeAccount = accounts[1];
      const state = await mockStateWithMainnetAccounts(accounts);
      const originalAccountsFromState = [...state.accContracts];
      const expectedAccountsAfterRemoved = originalAccountsFromState.filter(
        (account) =>
          account.address !== removeAccount.address &&
          account.chainId === removeAccount.chainId,
      );

      const stateManager = new AccountStateManager();
      await stateManager.removeAccount(removeAccount);

      expect(state.accContracts).toStrictEqual(expectedAccountsAfterRemoved);
      expect(state.removedAccounts).toHaveProperty(testnetChainId);
      expect(state.removedAccounts[testnetChainId]).toStrictEqual([
        removeAccount.addressIndex,
      ]);
    });

    it('throws an `Account does not exist` error if the removed account does not exist', async () => {
      const [removeAccount, ...accounts] = await generateTestnetAccounts();
      await mockStateWithMainnetAccounts(accounts);

      const stateManager = new AccountStateManager();
      await expect(stateManager.removeAccount(removeAccount)).rejects.toThrow(
        'Account does not exist',
      );
    });
  });

  describe('isMaxAccountLimitExceeded', () => {
    it('returns true if the account limit is reached', async () => {
      const accounts = await generateTestnetAccounts(
        Config.account.maxAccountToCreate + 1,
      );
      await mockStateWithMainnetAccounts(accounts);

      const stateManager = new AccountStateManager();
      const result = await stateManager.isMaxAccountLimitExceeded({
        chainId: testnetChainId,
      });

      expect(result).toBe(true);
    });

    it('returns false if the account limit is not reached', async () => {
      const accounts = await generateTestnetAccounts(
        Config.account.maxAccountToCreate,
      );
      await mockStateWithMainnetAccounts(accounts);

      const stateManager = new AccountStateManager();
      const result = await stateManager.isMaxAccountLimitExceeded({
        chainId: testnetChainId,
      });

      expect(result).toBe(false);
    });
  });

  describe('getCurrentAccount', () => {
    const setupGetCurrentAccountTest = async () => {
      const accounts = await generateTestnetAccounts();
      const state = await mockStateWithMainnetAccounts();

      const testnetCurrentAccount = accounts[0];
      const mainnetCurrentAccount = state.accContracts[0];

      state.currentAccount = {
        [testnetChainId]: testnetCurrentAccount,
        [mainnetChainId]: mainnetCurrentAccount,
      };
      state.accContracts = state.accContracts.concat(accounts);
      return {
        testnetCurrentAccount,
        mainnetCurrentAccount,
        state,
      };
    };

    it('returns the current account for the testnet', async () => {
      const { testnetCurrentAccount } = await setupGetCurrentAccountTest();

      const stateManager = new AccountStateManager();
      const result = await stateManager.getCurrentAccount({
        chainId: testnetChainId,
      });

      expect(result).toStrictEqual(testnetCurrentAccount);
    });

    it('returns the current account for the mainnet', async () => {
      const { mainnetCurrentAccount } = await setupGetCurrentAccountTest();

      const stateManager = new AccountStateManager();
      const result = await stateManager.getCurrentAccount({
        chainId: mainnetChainId,
      });

      expect(result).toStrictEqual(mainnetCurrentAccount);
    });

    it('returns null if no current account found', async () => {
      const { state } = await setupGetCurrentAccountTest();
      state.currentAccount = {};

      const stateManager = new AccountStateManager();
      const result = await stateManager.getCurrentAccount({
        chainId: testnetChainId,
      });

      expect(result).toBeNull();
    });
  });

  describe('switchAccount', () => {
    const setupSwitchAccountTest = async () => {
      const [testnetCurrentAccount] = await generateTestnetAccounts();
      const state = await mockStateWithMainnetAccounts([testnetCurrentAccount]);

      return {
        testnetCurrentAccount,
        state,
      };
    };

    it('switchs the current account', async () => {
      const { testnetCurrentAccount, state } = await setupSwitchAccountTest();
      // simulate the account to switch for that contains updated data.
      const updatedAccountToSwitch = {
        ...testnetCurrentAccount,
        upgradeRequired: true,
      };

      const stateManager = new AccountStateManager();
      await stateManager.switchAccount({
        chainId: testnetChainId,
        accountToSwitch: updatedAccountToSwitch,
      });

      const updatedAccountFromState = state.accContracts.find(
        (acc) =>
          acc.chainId === updatedAccountToSwitch.chainId &&
          acc.address === updatedAccountToSwitch.address,
      );

      expect(state.currentAccount).toHaveProperty(testnetChainId);
      expect(state.currentAccount[testnetChainId]).toStrictEqual(
        updatedAccountToSwitch,
      );
      expect(updatedAccountFromState).toStrictEqual(updatedAccountToSwitch);
    });

    it('throws `Account does not exist` error if the account to switch for is not exist', async () => {
      const { testnetCurrentAccount } = await setupSwitchAccountTest();
      const accountNotExist = {
        ...testnetCurrentAccount,
        address: '0x123456789',
      };

      const stateManager = new AccountStateManager();
      await expect(
        stateManager.switchAccount({
          chainId: testnetChainId,
          accountToSwitch: accountNotExist,
        }),
      ).rejects.toThrow(new StateManagerError('Account does not exist'));
    });

    it('throws `Account to switch is not in the same chain` error if the account to switch for does not has the same chain Id as the given chain Id', async () => {
      const { testnetCurrentAccount } = await setupSwitchAccountTest();

      const stateManager = new AccountStateManager();
      await expect(
        stateManager.switchAccount({
          chainId: mainnetChainId,
          accountToSwitch: testnetCurrentAccount,
        }),
      ).rejects.toThrow(
        new StateManagerError('Account to switch is not in the same chain'),
      );
    });
  });
});
