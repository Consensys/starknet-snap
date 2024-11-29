import type {  Infer } from 'superstruct';
import { assign,  nonempty, object, enums, optional } from 'superstruct';

import {
  BaseRequestStruct,
} from '../utils';
import { getTransactionStatus as getTransactionStatusFn } from '../utils/starknetUtils';
import { ChainRpcController } from './abstract/chain-rpc-controller';
import { HexStruct } from '@metamask/utils';
import { TransactionExecutionStatus, TransactionFinalityStatus } from 'starknet';

export const GetTransactionStatusRequestStruct = assign(
  object({
    transactionHash: nonempty(HexStruct),
  }),
  BaseRequestStruct,
);

export const GetTransactionStatusResponseStruct =object({
    executionStatus: optional(enums(Object.values(TransactionExecutionStatus))),
    finalityStatus: optional(enums(Object.values(TransactionFinalityStatus))),
})

export type GetTransactionStatusParams = Infer<typeof GetTransactionStatusRequestStruct>;

export type GetTransactionStatusResponse = Infer<typeof GetTransactionStatusResponseStruct>;

/**
 * The RPC handler to get a transaction status by the given transaction hash.
 */
export class GetTransactionStatusRpc extends ChainRpcController<
  GetTransactionStatusParams,
  GetTransactionStatusResponse
> {
  protected requestStruct = GetTransactionStatusRequestStruct;

  protected responseStruct = GetTransactionStatusResponseStruct;

  /**
   * Execute the get transaction request handler.
   *
   * @param params - The parameters of the request.
   * @param params.transactionHash - The transaction hash to enquire the transaction status.
   * @param params.chainId - The chain id of the transaction.
   * @returns A promise that resolves to a GetTransactionStatusResponse object.
   */
  async execute(params: GetTransactionStatusParams): Promise<GetTransactionStatusResponse> {
    return super.execute(params);
  }

  protected async handleRequest(
    params: GetTransactionStatusParams,
  ): Promise<GetTransactionStatusResponse> {
    const { transactionHash } = params;

    const resp = await getTransactionStatusFn(
      transactionHash,
      this.network,
    );
    
    return resp;
  }
}

export const getTransactionStatus = new GetTransactionStatusRpc();
