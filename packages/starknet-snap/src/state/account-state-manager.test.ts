import { constants } from 'starknet';

import type { StarknetAccount } from '../__tests__/helper';
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
    it('returns the account by address', async () => {
      const accountsInTestnet = await generateTestnetAccounts();
      await mockStateWithMainnetAccounts(accountsInTestnet);

      const stateManager = new AccountStateManager();
      const result = await stateManager.getAccount({
        address: accountsInTestnet[0].address,
        chainId: testnetChainId,
      });

      expect(result).toStrictEqual(accountsInTestnet[0]);
    });

    it('returns the account by index', async () => {
      const accountsInTestnet = await generateTestnetAccounts();
      await mockStateWithMainnetAccounts(accountsInTestnet);

      const stateManager = new AccountStateManager();
      const result = await stateManager.getAccount({
        addressIndex: accountsInTestnet[0].addressIndex,
        chainId: testnetChainId,
      });

      expect(result).toStrictEqual(accountsInTestnet[0]);
    });

    it('returns null if the account can not be found', async () => {
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

    it('throws a `Address or addressIndex must be provided` error if both `addressIndex` and `address` have not provided', async () => {
      const accountsInTestnet = await generateTestnetAccounts();
      await mockStateWithMainnetAccounts(accountsInTestnet);

      const stateManager = new AccountStateManager();
      await expect(
        stateManager.getAccount({
          chainId: testnetChainId,
        }),
      ).rejects.toThrow('Address or addressIndex must be provided');
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

  describe('addAccount', () => {
    it('add the account if the account does not exist', async () => {
      const [newAccount, ...accounts] = await generateTestnetAccounts();

      const state = await mockStateWithMainnetAccounts(accounts);
      const originalAccountsLength = state.accContracts.length;

      const stateManager = new AccountStateManager();
      await stateManager.addAccount(newAccount);

      expect(state.accContracts).toHaveLength(originalAccountsLength + 1);
      expect(
        state.accContracts.find(
          (acc) =>
            acc.address === newAccount.address &&
            acc.chainId === newAccount.chainId,
        ),
      ).toStrictEqual(newAccount);
    });

    it('throws a `Account already exists` error if the account already exist', async () => {
      const accounts = await generateTestnetAccounts(1);
      await mockStateWithMainnetAccounts(accounts);

      const stateManager = new AccountStateManager();

      await expect(stateManager.addAccount(accounts[0])).rejects.toThrow(
        'Account already exists',
      );
    });

    it('throws a `Account name already exists` error if the account name chosen already exist', async () => {
      const [account1, account2] = await generateTestnetAccounts(2);
      await mockStateWithMainnetAccounts([account1]);

      const stateManager = new AccountStateManager();
      account2.accountName = account1.accountName;

      await expect(stateManager.addAccount(account2)).rejects.toThrow(
        'Account name already exists',
      );
    });
  });

  describe('updateAccountByAddress', () => {
    it('updates the account if the account is found', async () => {
      const accounts = await generateTestnetAccounts();
      const updatedAccount = {
        ...accounts[0],
        upgradeRequired: true,
      };
      const state = await mockStateWithMainnetAccounts(accounts);
      const originalAccountsLength = state.accContracts.length;

      const stateManager = new AccountStateManager();
      await stateManager.updateAccountByAddress(updatedAccount);

      expect(state.accContracts).toHaveLength(originalAccountsLength);
      expect(
        state.accContracts.find(
          (acc) =>
            acc.address === updatedAccount.address &&
            acc.chainId === updatedAccount.chainId,
        ),
      ).toStrictEqual(updatedAccount);
    });

    it('throws `Account does not exists` error if the account does not exist', async () => {
      const [account] = await generateTestnetAccounts(1);
      await mockStateWithMainnetAccounts();

      const stateManager = new AccountStateManager();

      await expect(
        stateManager.updateAccountByAddress(account),
      ).rejects.toThrow('Account does not exists');
    });

    it('throws `Account name already exists` error if the account name is already used', async () => {
      const accounts = await generateTestnetAccounts();
      const updatedAccount = {
        ...accounts[0],
        accountName: 'Account 3',
      };
      await mockStateWithMainnetAccounts(accounts);
      const stateManager = new AccountStateManager();
      await expect(
        stateManager.updateAccountByAddress(updatedAccount),
      ).rejects.toThrow('Account name already exists');
    });
  });

  describe('getNextIndex', () => {
    const setupGetNextIndexTest = async () => {
      const state = await mockStateWithMainnetAccounts();
      return state;
    };

    it('returns index 0 if `accContracts` are empty for the given chainId', async () => {
      await setupGetNextIndexTest();

      const stateManager = new AccountStateManager();
      const result = await stateManager.getNextIndex(testnetChainId);

      expect(result).toBe(0);
    });

    it('returns the length of index `accContracts` for the given chainId', async () => {
      const accounts = await generateTestnetAccounts();
      const state = await setupGetNextIndexTest();
      state.accContracts = state.accContracts.concat(accounts);

      const stateManager = new AccountStateManager();
      const result = await stateManager.getNextIndex(testnetChainId);

      expect(result).toStrictEqual(accounts.length);
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

    it('switches the current account', async () => {
      const { testnetCurrentAccount: accountToSwitch, state } =
        await setupSwitchAccountTest();

      const stateManager = new AccountStateManager();
      await stateManager.switchAccount({
        chainId: testnetChainId,
        accountToSwitch,
      });

      expect(state.currentAccount).toHaveProperty(testnetChainId);
      expect(state.currentAccount[testnetChainId]).toStrictEqual(
        accountToSwitch,
      );
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

  describe('setCurrentAccount', () => {
    it('sets the current account', async () => {
      const [testnetCurrentAccount] = await generateTestnetAccounts();
      const state = await mockStateWithMainnetAccounts([testnetCurrentAccount]);

      const stateManager = new AccountStateManager();
      await stateManager.setCurrentAccount(testnetCurrentAccount);

      expect(state.currentAccount).toHaveProperty(testnetChainId);
      expect(state.currentAccount[testnetChainId]).toStrictEqual(
        testnetCurrentAccount,
      );
    });
  });
});
