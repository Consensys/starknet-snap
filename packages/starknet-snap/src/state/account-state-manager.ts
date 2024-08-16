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
  getCollection(state: SnapState): AccContract[] {
    return state.accContracts;
  }

  updateEntity(dataInState: AccContract, data: AccContract): void {
    dataInState.deployTxnHash = data.deployTxnHash;

    if (data.upgradeRequired !== undefined) {
      dataInState.upgradeRequired = data.upgradeRequired;
    }
    if (data.deployRequired !== undefined) {
      dataInState.deployRequired = data.deployRequired;
    }
  }

  async findAccount(
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

  async updateAccount(data: AccContract): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const accountInState = await this.findAccount(
          {
            address: data.address,
            chainId: data.chainId,
          },
          state,
        );

        if (!accountInState) {
          throw new Error(`Account does not exist`);
        }

        this.updateEntity(accountInState, data);
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  async addAccount(acc: AccContract): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const accountInState = await this.findAccount(
          {
            address: acc.address,
            chainId: acc.chainId,
          },
          state,
        );

        if (accountInState) {
          throw new Error(`Account already exist`);
        }
        state.accContracts.push(acc);
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }
}
