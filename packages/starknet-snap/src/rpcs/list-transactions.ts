import type { Infer } from 'superstruct';
import {
  assign,
  max,
  optional,
  min,
  number,
  type,
  array,
  string,
  object,
} from 'superstruct';

import { AddressStruct, BaseRequestStruct, TransactionStruct } from '../utils';
import { createTransactionService } from '../utils/factory';
import { ChainRpcController } from './abstract/chain-rpc-controller';

export const ListTransactionsRequestStruct = assign(
  // FIXME: Having type struct to enable backward compatibility. But it should be replaced by object() in future.
  type({
    // The txnsInLastNumOfDays is optional, but it has to be between 1 and 365.
    txnsInLastNumOfDays: optional(max(min(number(), 1), 365)),
    cursor: optional(
      type({
        blockNumber: min(number(), 0),
        txnHash: string(),
      }),
    ),
    senderAddress: AddressStruct,
    contractAddress: AddressStruct,
  }),
  BaseRequestStruct,
);

export const TransactionsStruct = array(TransactionStruct);
export const TransactionsCursorStruct = type({
  blockNumber: min(number(), -1),
  txnHash: string(),
});

export const ListTransactionsResponseStruct = object({
  transactions: TransactionsStruct,
  cursor: optional(TransactionsCursorStruct),
});

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
    const { senderAddress, contractAddress, cursor } = params;

    const service = createTransactionService(this.network);
    const transactions = await service.getTransactions(
      senderAddress,
      contractAddress,
      cursor,
    );

    return transactions as unknown as ListTransactionsResponse;
  }
}

export const listTransactions = new ListTransactionsRpc();
