import type { GetTransactionResponse } from 'starknet';

export type TransactionStatuses = {
  executionStatus: string | undefined;
  finalityStatus: string | undefined;
};

// Temp fix for the missing type declare in the GetTransactionResponse
export type TransactionResponse = GetTransactionResponse & {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  sender_address?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  contract_address?: string;
  calldata?: string[];
};
