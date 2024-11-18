import type { SnapState, TransactionRequest } from '../types/snapState';
import { logger } from '../utils';
import type { IFilter } from './filter';
import { StringFllter } from './filter';
import { StateManager, StateManagerError } from './state-manager';

type BaseRequestState = {
  id: string;
};

export type IRequestFilter<RequestState> = IFilter<RequestState>;

export class IdFilter<RequestState>
  extends StringFllter<RequestState>
  implements IRequestFilter<RequestState>
{
  dataKey = 'id';
}

export class InterfaceIdFilter<RequestState>
  extends StringFllter<RequestState>
  implements IRequestFilter<RequestState>
{
  dataKey = 'interfaceId';
}

export abstract class RequestStateManager<
  RequestState extends BaseRequestState,
> extends StateManager<RequestState> {
  protected abstract getCollection(state: SnapState): RequestState[];

  protected abstract updateEntity(
    dataInState: RequestState,
    data: RequestState,
  ): void;

  protected abstract getStateKey(): keyof SnapState;

  async findRequest(
    filters: IRequestFilter<RequestState>[],
    state?: SnapState,
  ): Promise<RequestState | null> {
    if (filters.length === 0) {
      throw new StateManagerError(
        'At least one search condition must be provided',
      );
    }
    return await this.find(filters, state);
  }

  async upsertRequest(data: RequestState & { id: string }): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const dataInState = await this.findRequest(
          [new IdFilter<RequestState>([data.id])],
          state,
        );

        if (dataInState === null) {
          this.getCollection(state)?.push(data);
        } else {
          this.updateEntity(dataInState, data);
        }
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  async removeRequest(id: string): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const collection = this.getCollection(state);
        const initialSize = collection.length;

        // Filter out the request with the given id
        const updatedCollection = collection.filter((item) => item.id !== id);

        // Update the state with the filtered collection
        if (Array.isArray(updatedCollection)) {
          const stateKey = this.getStateKey();
          state[stateKey] = updatedCollection as any;
        }

        // Log a warning if no items were removed
        if (initialSize === updatedCollection.length) {
          logger.warn(`Request with id ${id} does not exist`);
        }
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Finds a single object in the collection based on its ID or other filters.
   *
   * @param param - The object containing search parameters.
   * @param param.id - The ID to search for.
   * @param param.interfaceId - (Optional) An additional search parameter.
   * @param state - The current SnapState (optional, uses default state if not provided).
   * @returns A Promise that resolves to the found object or null if not found.
   */
  async getRequest(
    { id, interfaceId }: { id?: string; interfaceId?: string },
    state?: SnapState,
  ): Promise<RequestState | null> {
    const filters: IRequestFilter<RequestState>[] = [];
    if (id) {
      filters.push(new IdFilter<RequestState>([id]));
    }
    if (interfaceId) {
      filters.push(new InterfaceIdFilter<RequestState>([interfaceId]));
    }

    if (filters.length === 0) {
      throw new StateManagerError(
        'At least one search condition must be provided',
      );
    }

    return await this.find(filters, state);
  }
}

export class TransactionRequestStateManager extends RequestStateManager<TransactionRequest> {
  protected getCollection(state: SnapState): TransactionRequest[] {
    return state.transactionRequests ?? [];
  }

  protected updateEntity(
    dataInState: TransactionRequest,
    data: TransactionRequest,
  ): void {
    dataInState.maxFee = data.maxFee;
    dataInState.selectedFeeToken = data.selectedFeeToken;
    dataInState.resourceBounds = [...data.resourceBounds];
  }

  protected getStateKey(): keyof SnapState {
    return 'transactionRequests';
  }
}
