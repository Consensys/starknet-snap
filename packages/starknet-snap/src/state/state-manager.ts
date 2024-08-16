import type { SnapState } from '../types/snapState';
import { SnapStateManager } from '../utils';
import type { IFilter } from './filter';

export class StateManagerError extends Error {}

export abstract class StateManager<Entity> extends SnapStateManager<SnapState> {
  protected override async get(): Promise<SnapState> {
    return super.get().then((state: SnapState) => {
      if (!state) {
        // eslint-disable-next-line no-param-reassign
        state = {
          accContracts: [],
          erc20Tokens: [],
          networks: [],
          transactions: [],
        };
      }

      if (!state.accContracts) {
        state.accContracts = [];
      }

      if (!state.erc20Tokens) {
        state.erc20Tokens = [];
      }

      if (!state.networks) {
        state.networks = [];
      }

      if (!state.transactions) {
        state.transactions = [];
      }

      return state;
    });
  }

  abstract getCollection(state: SnapState): Entity[] | undefined;

  abstract updateEntity(dataInState: Entity, data: Entity): void;

  async find(
    filters: IFilter<Entity>[],
    state?: SnapState,
  ): Promise<Entity | null> {
    const snapState = state ?? (await this.get());
    return (
      this.getCollection(snapState)?.find((data) => {
        return filters.every((filter) => filter.apply(data));
      }) ?? null
    );
  }

  async list(
    filters: IFilter<Entity>[],
    sort?: (entityA: Entity, entityB: Entity) => number,
    state?: SnapState,
  ): Promise<Entity[]> {
    const snapState = state ?? (await this.get());
    return (
      this.getCollection(snapState)
        ?.filter((data) => {
          return filters.every((filter) => filter.apply(data));
        })
        .sort(sort) ?? []
    );
  }
  // TODO: Remove this if no longer needed
  // async upsert(data: Entity, condition: IFilter<Entity>[]): Promise<void> {
  //   try {
  //     await this.update(async (state: SnapState) => {
  //       const dataInState = await this.find(condition, state);

  //       if (dataInState !== null) {
  //         this.updateEntity(dataInState, data);
  //       } else {
  //         this.getCollection(state)?.push(data);
  //       }
  //     });
  //   } catch (error) {
  //     throw new StateManagerError(error.message);
  //   }
  // }
}
