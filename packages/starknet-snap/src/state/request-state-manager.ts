import type { TransactionRequest, SnapState } from '../types/snapState';
import { logger } from '../utils';
import type { IFilter } from './filter';
import { StringFllter } from './filter';
import { StateManager, StateManagerError } from './state-manager';

export type ITransactionRequestFilter = IFilter<TransactionRequest>;

export class IdFilter
  extends StringFllter<TransactionRequest>
  implements ITransactionRequestFilter
{
  dataKey = 'id';
}

export class InterfaceIdFilter
  extends StringFllter<TransactionRequest>
  implements ITransactionRequestFilter
{
  dataKey = 'interfaceId';
}

export class TransactionRequestStateManager extends StateManager<TransactionRequest> {
  protected getCollection(state: SnapState): TransactionRequest[] {
    return state.transactionRequests ?? [];
  }

  protected updateEntity(
    dataInState: TransactionRequest,
    data: TransactionRequest,
  ): void {
    // This is the only field that can be updated
    dataInState.maxFee = data.maxFee;
    dataInState.selectedFeeToken = data.selectedFeeToken;
    dataInState.resourceBounds = [...data.resourceBounds];
  }

  /**
   * Finds a `TransactionRequest` object based on the given requestId or interfaceId.
   *
   * @param param - The param object.
   * @param param.requestId - The requestId to search for.
   * @param param.interfaceId - The interfaceId to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the `TransactionRequest` object if found, or null if not found.
   */
  async getTransactionRequest(
    {
      requestId,
      interfaceId,
    }: {
      requestId?: string;
      interfaceId?: string;
    },
    state?: SnapState,
  ): Promise<TransactionRequest | null> {
    const filters: ITransactionRequestFilter[] = [];
    if (requestId) {
      filters.push(new IdFilter([requestId]));
    }
    if (interfaceId) {
      filters.push(new InterfaceIdFilter([interfaceId]));
    }
    if (filters.length === 0) {
      throw new StateManagerError(
        'At least one search condition must be provided',
      );
    }
    return await this.find(filters, state);
  }

  /**
   * Upsert a `TransactionRequest` in the state with the given data.
   *
   * @param data - The `TransactionRequest` object.
   * @returns A Promise that resolves when the upsert is complete.
   */
  async upsertTransactionRequest(data: TransactionRequest): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const dataInState = await this.getTransactionRequest(
          {
            requestId: data.id,
          },
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

  /**
   * Removes the `TransactionRequest` objects in the state with the given requestId.
   *
   * @param requestId - The requestId to search for.
   * @returns A Promise that resolves when the remove is complete.
   */
  async removeTransactionRequest(requestId: string): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const sizeOfTransactionRequests = this.getCollection(state).length;

        state.transactionRequests = this.getCollection(state).filter((req) => {
          return req.id !== requestId;
        });

        // Check if the TransactionRequest was removed
        if (sizeOfTransactionRequests === this.getCollection(state).length) {
          // If the TransactionRequest does not exist, log a warning instead of throwing an error
          logger.warn(`TransactionRequest with id ${requestId} does not exist`);
        }
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }
}
