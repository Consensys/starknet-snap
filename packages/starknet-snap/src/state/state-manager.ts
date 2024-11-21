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
          transactionRequests: [],
        };
      }

      if (!state.transactionRequests) {
        state.transactionRequests = [];
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

  protected abstract getCollection(state: SnapState): Entity[] | undefined;

  protected abstract updateEntity(dataInState: Entity, data: Entity): void;

  /**
   *
   * Finds an entity in the state that matches the given filters.
   *
   * @param filters - An array of filters to apply to the entities.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the matching Entity object if found, or null if not found.
   */
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

  /**
   *
   * Lists all entities in the state that match the given filters, optionally sorted.
   *
   * @param filters - An array of filters to apply to the entities.
   * @param [sort] - An optional sorting function.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with an array of matching Entity objects.
   */
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
