import {
  TransactionExecutionStatus,
  TransactionFinalityStatus,
  TransactionType,
} from 'starknet';
import type { Infer } from 'superstruct';
import { array, nullable, number, object, string, enums } from 'superstruct';

/* eslint-disable @typescript-eslint/naming-convention */
const NullableStringStruct = nullable(string());
const NullableStringArrayStruct = nullable(array(string()));

export const StarkScanAccountCallStruct = object({
  contract_address: string(),
  calldata: array(string()),
  selector_name: string(),
});

export const StarkScanTransactionStruct = object({
  transaction_hash: string(),
  transaction_finality_status: enums(Object.values(TransactionFinalityStatus)),
  transaction_execution_status: enums(
    Object.values(TransactionExecutionStatus),
  ),
  transaction_type: enums(Object.values(TransactionType)),
  // The transaction version, 1 or 3, where 3 represents the fee will be paid in STRK
  version: number(),
  max_fee: NullableStringStruct,
  actual_fee: NullableStringStruct,
  nonce: NullableStringStruct,
  contract_address: NullableStringStruct,
  calldata: NullableStringArrayStruct,
  sender_address: NullableStringStruct,
  timestamp: number(),
  revert_error: NullableStringStruct,
  account_calls: array(StarkScanAccountCallStruct),
});

export type StarkScanAccountCall = Infer<typeof StarkScanAccountCallStruct>;

export type StarkScanTransaction = Infer<typeof StarkScanTransactionStruct>;

export const StarkScanTransactionsResponseStruct = object({
  next_url: nullable(string()),
  data: array(StarkScanTransactionStruct),
});

export type StarkScanTransactionsResponse = Infer<
  typeof StarkScanTransactionsResponseStruct
>;

export type StarkScanOptions = {
  apiKey: string;
};
/* eslint-enable */
