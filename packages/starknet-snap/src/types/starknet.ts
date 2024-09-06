import type { GetTransactionResponse } from 'starknet';
import type { Infer } from 'superstruct';

import type { TxVersionStruct } from '../utils';

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

export type TransactionVersion = Infer<typeof TxVersionStruct>;

export type DeployAccountPayload = {
  classHash: string;
  contractAddress: string;
  constructorCalldata: string[];
  addressSalt: string;
};
