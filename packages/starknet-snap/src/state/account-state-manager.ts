import type { AccContract, SnapState } from '../types/snapState';
import { getDefaultAccountName } from '../utils/account';
import type { IFilter } from './filter';
import {
  AddressFilter as BaseAddressFilter,
  ChainIdFilter as BaseChainIdFilter,
  NumberFilter,
} from './filter';
import { StateManager, StateManagerError } from './state-manager';

export type IAccountFilter = IFilter<AccContract>;

export class AddressIndexFilter
  extends NumberFilter<AccContract>
  implements IAccountFilter
{
  dataKey = 'addressIndex';
}

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
    if (data.accountName !== undefined) {
      dataInState.accountName = data.accountName;
    }
  }

  /**
   * Finds an account in the state that matches the given address and chain ID.
   *
   * @param param - An object containing the address and chain ID to search for.
   * @param param.chainId - The chain ID of the account to search for.
   * @param [param.address] - The address of the account to search for.
   * @param [param.addressIndex] - The address index of the account to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the matching AccContract object if found, or null if not found.
   * @throws {StateManagerError} If both address and addressIndex is not provided.
   */
  async getAccount(
    {
      address,
      chainId,
      addressIndex,
    }: {
      address?: string;
      addressIndex?: number;
      chainId: string;
    },
    state?: SnapState,
  ): Promise<AccContract | null> {
    try {
      if (address === undefined && addressIndex === undefined) {
        throw new Error(`Address or addressIndex must be provided`);
      }

      const filters: IAccountFilter[] = [new ChainIdFilter([chainId])];
      if (address !== undefined) {
        filters.push(new AddressFilter([address]));
      }
      if (addressIndex !== undefined) {
        filters.push(new AddressIndexFilter([addressIndex]));
      }

      return this.find(filters, state);
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * List the accounts in the state that match the chain ID, ensuring default values
   * for `accountName` if they are not set.
   *
   * @param param - An object containing the chain ID to search for.
   * @param param.chainId - The chain ID of the accounts to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with an array of the matching `AccContract` objects, with defaults applied.
   */
  async findAccounts(
    {
      chainId,
    }: {
      chainId: string;
    },
    state?: SnapState,
  ): Promise<AccContract[]> {
    const accounts = await this.list(
      [new ChainIdFilter([chainId])],
      // sort by index in asc order
      (entityA: AccContract, entityB: AccContract) =>
        entityA.addressIndex - entityB.addressIndex,
      state,
    );
    // Ensure default values for accountName
    return accounts.map((account) => ({
      ...account,
      accountName:
        account.accountName ?? getDefaultAccountName(account.addressIndex),
    }));
  }

  /**
   * Update an account by address in the state.
   *
   * @param account - The AccContract object to update.
   * @throws {StateManagerError} If the account does not exist in the state.
   * or if an account with the same name already exists.
   */
  async updateAccountByAddress(account: AccContract): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const { chainId, address } = account;

        const accountInState = await this.getAccount(
          {
            address,
            chainId,
          },
          state,
        );

        if (!accountInState) {
          throw new Error(`Account does not exists`);
        }

        const trimedAccountName = account.accountName?.trim();
        if (
          trimedAccountName &&
          trimedAccountName !== accountInState.accountName &&
          (await this.isAccountNameExist(
            { accountName: trimedAccountName, chainId },
            state,
          ))
        ) {
          throw new Error(`Account name already exists`);
        }

        this.updateEntity(accountInState, {
          ...account,
          accountName: trimedAccountName,
        });
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Add an account in the state.
   *
   * @param account - The AccContract object to add.
   * @throws {StateManagerError} If an error occurs while updating the state.
   */
  async addAccount(account: AccContract): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const { chainId, address, addressIndex } = account;

        if (
          await this.isAccountExist({ address, addressIndex, chainId }, state)
        ) {
          throw new Error(`Account already exists`);
        }

        const trimedAccountName = account.accountName?.trim();
        if (
          trimedAccountName &&
          (await this.isAccountNameExist(
            { accountName: trimedAccountName, chainId },
            state,
          ))
        ) {
          throw new Error(`Account name already exists`);
        }

        state.accContracts.push({
          ...account,
          accountName: trimedAccountName,
        });
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
   * @param state
   * @returns A Promise that resolves to the next index.
   */
  async getNextIndex(chainId: string, state?: SnapState): Promise<number> {
    return (await this.findAccounts({ chainId }, state)).length;
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

        this.#setCurrentAccount(accountToSwitch, state);
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  async isAccountExist(
    {
      address,
      addressIndex,
      chainId,
    }: { address: string; addressIndex: number; chainId: string },
    state,
  ): Promise<boolean> {
    const snapState = state ?? (await this.get());
    return (
      this.getCollection(snapState).find(
        (data) =>
          (data.address === address || data.addressIndex === addressIndex) &&
          data.chainId === chainId,
      ) !== undefined
    );
  }

  async isAccountNameExist(
    { accountName, chainId }: { accountName: string; chainId: string },
    state,
  ): Promise<boolean> {
    const snapState = state ?? (await this.get());
    return (
      this.getCollection(snapState).find(
        (data) =>
          data.accountName?.trim() === accountName && data.chainId === chainId,
      ) !== undefined
    );
  }

  #setCurrentAccount(account: AccContract, state: SnapState) {
    const { chainId } = account;
    state.currentAccount = state.currentAccount ?? {};
    state.currentAccount[chainId] = account;
  }

  /**
   * Sets the current account for the specified chain ID without processing swtichAccount logic.
   *
   * @param account - The `AccContract` object to set as the current account.
   */
  async setCurrentAccount(account: AccContract): Promise<void> {
    await this.update(async (state: SnapState) => {
      this.#setCurrentAccount(account, state);
    });
  }
}
