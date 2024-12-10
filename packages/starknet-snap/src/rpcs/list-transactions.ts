import type { Infer } from 'superstruct';
import { assign, max, optional, min, number, type, array } from 'superstruct';

import { Config } from '../config';
import { AddressStruct, BaseRequestStruct, TransactionStruct } from '../utils';
import { createTransactionService } from '../utils/factory';
import { ChainRpcController } from './abstract/chain-rpc-controller';

export const ListTransactionsRequestStruct = assign(
  // FIXME: Having type struct to enable backward compatibility. But it should be replaced by object() in future.
  type({
    // The txnsInLastNumOfDays is optional, but it has to be between 1 and 365.
    txnsInLastNumOfDays: optional(max(min(number(), 1), 365)),
    senderAddress: AddressStruct,
    contractAddress: AddressStruct,
  }),
  BaseRequestStruct,
);

export const ListTransactionsResponseStruct = array(TransactionStruct);

export type ListTransactionsParams = Infer<
  typeof ListTransactionsRequestStruct
>;

export type ListTransactionsResponse = Infer<
  typeof ListTransactionsResponseStruct
>;

/**
 * The RPC handler to list the transactions by the given senderAddress, contractAddress.
 */
export class ListTransactionsRpc extends ChainRpcController<
  ListTransactionsParams,
  ListTransactionsResponse
> {
  protected requestStruct = ListTransactionsRequestStruct;

  protected responseStruct = ListTransactionsResponseStruct;

  /**
   * Execute the list transactions handler.
   *
   * @param params - The parameters of the request.
   * @param params.chainId - The chain id of the transaction.
   * @param params.senderAddress - The sender address of the transaction.
   * @param params.contractAddress - The contract address of the transaction.
   * @param params.txnsInLastNumOfDays - The number of days to get the transactions.
   * @returns A promise that resolves to a ListTransactionsResponse object.
   */
  async execute(
    params: ListTransactionsParams,
  ): Promise<ListTransactionsResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: ListTransactionsParams,
  ): Promise<ListTransactionsResponse> {
    const { senderAddress, contractAddress, txnsInLastNumOfDays } = params;
    const tillToInDay =
      txnsInLastNumOfDays ?? Config.transaction.list.txnsInLastNumOfDays;

    const service = createTransactionService(this.network);
    const transactions = await service.getTransactions(
      senderAddress,
      contractAddress,
      tillToInDay,
    );

    return transactions as unknown as ListTransactionsResponse;
  }
}

export const listTransactions = new ListTransactionsRpc();
