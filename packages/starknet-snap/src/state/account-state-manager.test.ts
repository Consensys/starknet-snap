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

  it('updates the account name', async () => {
    const accounts = await generateTestnetAccounts();
    await mockStateWithMainnetAccounts(accounts);
    const accountToToggle = accounts[0];

    const stateManager = new AccountStateManager();
    await stateManager.setAccountName({
      address: accountToToggle.address,
      chainId: accountToToggle.chainId,
      accountName: 'mySuperAccount',
    });

    expect(accountToToggle.accountName).toBe('mySuperAccount');
  });

  describe('toggleAccountVisibility', () => {
    it.each([true, false])(
      'toggles the account visibility - %s',
      async (visibility) => {
        const accounts = await generateTestnetAccounts();
        await mockStateWithMainnetAccounts(accounts);
        const accountToToggle = accounts[0];

        const stateManager = new AccountStateManager();
        await stateManager.toggleAccountVisibility({
          address: accountToToggle.address,
          chainId: accountToToggle.chainId,
          visibility,
        });

        expect(accountToToggle.visibility).toStrictEqual(visibility);
      },
    );

    describe('switches to a visible account if the account toggles to hidden and it is the current account', () => {
      const setupNextVisibleAccountTest = async (
        accountToToggleIndex = 0,
        accountCount = 5,
      ) => {
        const accounts = await generateTestnetAccounts(accountCount);
        const state = await mockStateWithMainnetAccounts(accounts);

        const accountToToggle = accounts[accountToToggleIndex];
        // Simulate the current account is same with the account to toggle.
        state.currentAccount[testnetChainId] = accountToToggle;

        return {
          accounts,
          accountToToggle,
          state,
        };
      };

      it('switches to the next visible account if there is one', async () => {
        const { accounts, accountToToggle, state } =
          await setupNextVisibleAccountTest(2, 5);
        // Simulate the visibility of the next account is a hidden account too.
        accounts[3].visibility = false;

        const stateManager = new AccountStateManager();
        await stateManager.toggleAccountVisibility({
          address: accountToToggle.address,
          chainId: accountToToggle.chainId,
          visibility: false,
        });
        // Expect the current account is the `accounts[4]`, due to the next account `accounts[3]` is hidden.
        expect(state.currentAccount[testnetChainId]).toStrictEqual(accounts[4]);
      });

      it('switches to the first visible account if there are no next available accounts to pick', async () => {
        const { accounts, accountToToggle, state } =
          await setupNextVisibleAccountTest(4, 5);
        // Simulate the visibility of the first account is a hidden account too.
        accounts[0].visibility = false;

        const stateManager = new AccountStateManager();
        await stateManager.toggleAccountVisibility({
          address: accountToToggle.address,
          chainId: accountToToggle.chainId,
          visibility: false,
        });
        // Expect the current account is the `accounts[1]`, due to the first account `accounts[0]` is hidden.
        expect(state.currentAccount[testnetChainId]).toStrictEqual(accounts[1]);
      });

      it('throws a `No visible accounts found, at least one account should be visible` error if there are no available accounts to pick', async () => {
        const { accountToToggle } = await setupNextVisibleAccountTest(0, 1);

        const stateManager = new AccountStateManager();
        await expect(
          stateManager.toggleAccountVisibility({
            address: accountToToggle.address,
            chainId: accountToToggle.chainId,
            visibility: false,
          }),
        ).rejects.toThrow(
          'No visible accounts found, at least one account should be visible',
        );
      });
    });

    it('throws a `Account does not exist` error if the removed account does not exist', async () => {
      const [removeAccount, ...accounts] = await generateTestnetAccounts();
      await mockStateWithMainnetAccounts(accounts);

      const stateManager = new AccountStateManager();
      await expect(
        stateManager.toggleAccountVisibility({
          address: removeAccount.address,
          chainId: removeAccount.chainId,
          visibility: false,
        }),
      ).rejects.toThrow('Account does not exist');
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

    it.each([
      {
        visibilityFromInput: true,
        visibilityFromState: false,
      },
      {
        visibilityFromInput: false,
        visibilityFromState: true,
      },
    ])(
      'throws `Hidden account cannot be switched` error if the account to switch for is hidden - visibilityFromInput: $visibilityFromInput, visibilityFromState: $visibilityFromState',
      async ({ visibilityFromInput, visibilityFromState }) => {
        const { testnetCurrentAccount } = await setupSwitchAccountTest();

        // simulate visibility of the account to switch in state.
        testnetCurrentAccount.visibility = visibilityFromState;
        // simulate visibility of the account to switch from input.
        const updatedAccountToSwitch = {
          ...testnetCurrentAccount,
          visibility: visibilityFromInput,
        };

        const stateManager = new AccountStateManager();

        await expect(
          stateManager.switchAccount({
            chainId: testnetChainId,
            accountToSwitch: updatedAccountToSwitch,
          }),
        ).rejects.toThrow(
          new StateManagerError('Hidden account cannot be switched'),
        );
      },
    );

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
