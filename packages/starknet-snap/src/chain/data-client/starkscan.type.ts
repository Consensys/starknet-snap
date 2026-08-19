import type { Infer } from 'superstruct';
import { array, boolean, nullable, number, object, string } from 'superstruct';

export const StarkScanTransactionStruct = object({
  blockNumber: number(),
  timestampIso: nullable(string()),
  txIndex: number(),
  txHash: string(),
  kinds: array(string()),
  counterparty: nullable(string()),
  txType: nullable(string()),
  executionStatus: nullable(string()),
  finalityStatus: nullable(string()),
  fromAddress: nullable(string()),
  toAddress: nullable(string()),
  primaryMethod: nullable(string()),
  callCount: nullable(number()),
  methodsDiffer: nullable(boolean()),
  transferCount: nullable(number()),
  topTransferTokenAddress: nullable(string()),
  topTransferAmount: nullable(string()),
  topTransferStandard: nullable(string()),
});

export type StarkScanTransaction = Infer<typeof StarkScanTransactionStruct>;

export const StarkScanTransactionsResponseStruct = object({
  items: array(StarkScanTransactionStruct),
  nextCursor: nullable(string()),
});

export type StarkScanTransactionsResponse = Infer<
  typeof StarkScanTransactionsResponseStruct
>;

export type StarkScanOptions = {
  apiKey: string;
};
