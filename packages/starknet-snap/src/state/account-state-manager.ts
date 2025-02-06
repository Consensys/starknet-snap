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
}
