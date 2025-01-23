import type { AccContract, SnapState } from '../types/snapState';
import type { IFilter } from './filter';
import {
  AddressFilter as BaseAddressFilter,
  ChainIdFilter as BaseChainIdFilter,
} from './filter';
import { StateManager, StateManagerError } from './state-manager';

export type IAccountFilter = IFilter<AccContract>;

export class AddressFilter
  extends BaseAddressFilter<AccContract>
  implements IAccountFilter {}

export class ChainIdFilter
  extends BaseChainIdFilter<AccContract>
  implements IAccountFilter {}

export class AccountStateManager extends StateManager<AccContract> {
  protected getCollection(state: SnapState): AccContract[] {
    return state.accContracts;
  }

  protected updateEntity(dataInState: AccContract, data: AccContract): void {
    dataInState.deployTxnHash = data.deployTxnHash;

    if (data.upgradeRequired !== undefined) {
      dataInState.upgradeRequired = data.upgradeRequired;
    }
    if (data.deployRequired !== undefined) {
      dataInState.deployRequired = data.deployRequired;
    }
    if (data.cairoVersion !== undefined) {
      dataInState.cairoVersion = data.cairoVersion;
    }
    if (data.visibility !== undefined) {
      dataInState.visibility = data.visibility;
    }
  }

  /**
   * Finds an account in the state that matches the given address and chain ID.
   *
   * @param param - An object containing the address and chain ID to search for.
   * @param param.address - The address of the account to search for.
   * @param param.chainId - The chain ID of the account to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the matching AccContract object if found, or null if not found.
   */
  async getAccount(
    {
      address,
      chainId,
    }: {
      address: string;
      chainId: string;
    },
    state?: SnapState,
  ): Promise<AccContract | null> {
    return this.find(
      [new AddressFilter([address]), new ChainIdFilter([chainId])],
      state,
    );
  }

  /**
   * List the account in the state that matches the chain ID.
   *
   * @param param - An object containing the chain ID to search for.
   * @param param.chainId - The chain ID of the account to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with a array of the matching AccContract object.
   */
  async findAccounts(
    {
      chainId,
    }: {
      chainId: string;
    },
    state?: SnapState,
  ): Promise<AccContract[]> {
    return this.list(
      [new ChainIdFilter([chainId])],
      // sort by index in asc order
      (entityA: AccContract, entityB: AccContract) =>
        entityA.addressIndex - entityB.addressIndex,
      state,
    );
  }

  /**
   * Upserts an account in the state.
   *
   * @param data - The AccContract object to upsert.
   * @throws {StateManagerError} If an error occurs while updating the state.
   */
  async upsertAccount(data: AccContract): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const accountInState = await this.getAccount(
          {
            address: data.address,
            chainId: data.chainId,
          },
          state,
        );

        if (accountInState) {
          this.updateEntity(accountInState, data);
        } else {
          state.accContracts.push(data);
        }
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  async updateAccountAsDeploy({
    address,
    chainId,
    transactionHash,
  }: {
    address: string;
    chainId: string;
    transactionHash: string;
  }): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const accountInState = await this.getAccount(
          {
            address,
            chainId,
          },
          state,
        );

        if (!accountInState) {
          throw new StateManagerError(`Account does not exist`);
        }

        accountInState.upgradeRequired = false;
        accountInState.deployRequired = false;
        accountInState.deployTxnHash = transactionHash;
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Gets the next index based on the chain ID.
   * The next index is referring to the length of `accContracts` for the chain ID is used.
   *
   * @param chainId - The chain ID.
   * @returns A Promise that resolves to the next index.
   */
  async getNextIndex(chainId: string): Promise<number> {
    let idx = 0;
    await this.update(async (state: SnapState) => {
      idx = (await this.findAccounts({ chainId }, state)).length;
    });
    return idx;
  }

  /**
   * Toggles the visibility of a account by address and chain ID.
   * If the visibility is `true`, the account will be shown.
   * If the visibility is `false`, the account will be hidden.
   * If the account to be hidden is the current selected account,
   * it will be switched to the next visible account.
   *
   * @param params - The parameters for toggle the account visibility.
   * @param params.address - The address of the account.
   * @param params.chainId - The chain ID of the account.
   * @param params.visibility - The visibility of the account.
   * @throws {StateManagerError} If the account to be removed does not exist.
   */
  async toggleAccountVisibility({
    address,
    chainId,
    visibility,
  }: {
    address: string;
    chainId: string;
    visibility: boolean;
  }): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const accountInState = await this.getAccount(
          {
            address,
            chainId,
          },
          state,
        );

        if (!accountInState) {
          throw new StateManagerError(`Account does not exist`);
        }

        accountInState.visibility = visibility;

        // if the current account is the account to be hide,
        // switch to the next visible account
        if (!this.#isAccountVisible(accountInState)) {
          const currentAccount = await this.getCurrentAccount(
            { chainId: accountInState.chainId },
            state,
          );

          if (currentAccount?.addressIndex === accountInState.addressIndex) {
            const accountToSwitch = await this.#getNextVisibleAccount(
              accountInState,
              state,
            );
            if (!accountToSwitch) {
              throw new StateManagerError(
                `No visible account found, at least one account should be visible`,
              );
            }
            this.#setCurrentAccount(accountToSwitch, state);
          }
        }
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Gets the next visible account base on the address index of a specified account.
   * The next visible account is the first visible account that has a larger address index.
   * If there is no next visible account, the first visible account is returned.
   * if there is no visible account, null is returned.
   *
   * @param account - The account to get the next visible account.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves to the next visible account.
   */
  async #getNextVisibleAccount(
    account: AccContract,
    state: SnapState,
  ): Promise<AccContract | null> {
    const data = state ?? (await this.get());

    const { chainId, addressIndex } = account;

    const accounts = await this.findAccounts({ chainId }, data);

    let firstAccount: AccContract | null = null;

    // Get the next visible account with the following rules:
    // - return the first visible account that has larger addressIndex if there is one
    // - return the first visible account if there is no next account
    for (const nextAccount of accounts) {
      // Ensure the account is not hidden and not the current account.
      // in case nextAccount.visibility may be undefined, check if it is not false instead
      if (
        this.#isAccountVisible(nextAccount) &&
        nextAccount.addressIndex !== addressIndex
      ) {
        // return the first visible account that has larger addressIndex if there is one
        if (nextAccount.addressIndex > addressIndex) {
          return nextAccount;
        }
        // assign the first visible account if there is no next account
        else if (firstAccount === null) {
          firstAccount = nextAccount;
        }
      }
    }

    // firstAccount may be null if there is no visible account
    return firstAccount;
  }

  #isAccountVisible(account: AccContract): boolean {
    return account.visibility !== false;
  }

  /**
   * Gets the current account for the specified chain ID.
   *
   * @param params - The parameters for getting the current account.
   * @param params.chainId - The chain ID.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves to the current account.
   */
  async getCurrentAccount(
    {
      chainId,
    }: {
      chainId: string;
    },
    state?: SnapState,
  ): Promise<AccContract | null> {
    const data = state ?? (await this.get());

    return data.currentAccount?.[chainId] ?? null;
  }

  /**
   * Switches the current account for the specified chain ID.
   * And updates the `AccContract` data for the current account from state.
   *
   * @param params - The parameters for switching the current account.
   * @param params.chainId - The chain ID.
   * @param params.accountToSwitch - The `AccContract` object to switch to.
   * @throws {StateManagerError} If the account to switch does not exist.
   */
  async switchAccount({
    chainId,
    accountToSwitch,
  }: {
    chainId: string;
    accountToSwitch: AccContract;
  }): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const { chainId: accountChainId, address } = accountToSwitch;

        // We should not relied on the `chainId` from the `accountToSwitch` object
        // therefore it is required to verify if the `accountToSwitch` object
        // whether it has the same chain ID or not
        if (chainId !== accountChainId) {
          throw new Error(`Account to switch is not in the same chain`);
        }

        // a safeguard to ensure the `accountToSwitch` is exist in the state
        const accountInState = await this.getAccount(
          {
            address,
            chainId: accountChainId,
          },
          state,
        );

        if (!accountInState) {
          throw new Error(`Account does not exist`);
        }

        // Safe guard to ensure the account to switch is not hidden,
        // by verifying the `visibility` property from state and the incoming `accountToSwitch` object
        if (
          !this.#isAccountVisible(accountInState) ||
          !this.#isAccountVisible(accountToSwitch)
        ) {
          throw new Error(`Hidden account cannot be switched`);
        }

        this.#setCurrentAccount(accountToSwitch, state);

        // due to the account may contains legacy data,
        // this is a hack to ensure the account is updated
        this.updateEntity(accountInState, accountToSwitch);
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  #setCurrentAccount(account: AccContract, state: SnapState) {
    const { chainId } = account;
    state.currentAccount = state.currentAccount ?? {};
    state.currentAccount[chainId] = account;
  }
}
