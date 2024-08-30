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
   * Updates an account in the state with the given data.
   *
   * @param data - The AccContract object to update.
   * @returns A Promise that resolves when the update is complete.
   * @throws {StateManagerError} If there is an error updating the account, such as:
   * If the account to be updated does not exist in the state.
   */
  async updateAccount(data: AccContract): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const accountInState = await this.getAccount(
          {
            address: data.address,
            chainId: data.chainId,
          },
          state,
        );

        if (!accountInState) {
          throw new StateManagerError(`Account does not exist`);
        }

        this.updateEntity(accountInState, data);
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Adds a new account to the state with the given data.
   *
   * @param data - The AccContract object to add.
   * @returns A Promise that resolves when the add is complete.
   * @throws {StateManagerError} If there is an error adding the account, such as:
   * If the account to be added already exists in the state.
   */
  async addAccount(data: AccContract): Promise<void> {
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
          throw new Error(`Account already exist`);
        }
        state.accContracts.push(data);
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
}
