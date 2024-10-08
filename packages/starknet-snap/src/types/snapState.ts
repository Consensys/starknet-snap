import type {
  RawCalldata,
  TransactionType as StarkNetTransactionType,
  TransactionExecutionStatus,
  TransactionFinalityStatus,
} from 'starknet';

/* eslint-disable */
export type SnapState = {
  accContracts: AccContract[];
  erc20Tokens: Erc20Token[];
  networks: Network[];
  transactions: Transaction[];
  currentNetwork?: Network;
};

export type AccContract = {
  addressSalt: string;
  publicKey: string; // in hex
  address: string; // in hex
  addressIndex: number;
  derivationPath: string;
  deployTxnHash: string; // in hex
  chainId: string; // in hex
  upgradeRequired?: boolean;
  deployRequired?: boolean;
};

export type Erc20Token = {
  address: string; // in hex
  name: string;
  symbol: string;
  decimals: number;
  chainId: string; // in hex
};

export type Network = {
  name: string;
  chainId: string; // in hex
  baseUrl: string;
  nodeUrl: string;
  voyagerUrl: string;
  accountClassHash: string; // in hex
  useOldAccounts?: boolean;
};

export enum TransactionType { // for sending txns via Starknet gateway
  DEPLOY = 'DEPLOY',
  DEPLOY_ACCOUNT = 'DEPLOY_ACCOUNT',
  INVOKE_FUNCTION = 'INVOKE_FUNCTION',
}

export enum VoyagerTransactionType { // for retrieving txns from Voyager
  DEPLOY = 'deploy',
  DEPLOY_ACCOUNT = 'deploy_account',
  INVOKE = 'invoke',
}

export enum TransactionStatus { // for retrieving txn from Starknet feeder gateway
  RECEIVED = 'RECEIVED',
  PENDING = 'PENDING',
  ACCEPTED_ON_L2 = 'ACCEPTED_ON_L2',
  ACCEPTED_ON_L1 = 'ACCEPTED_ON_L1',
  NOT_RECEIVED = 'NOT_RECEIVED',
  REJECTED = 'REJECTED',
}

export enum FinailityStatus {
  PENDING = 'PENDING',
  ACCEPTED_ON_L2 = 'ACCEPTED_ON_L2',
  ACCEPTED_ON_L1 = 'ACCEPTED_ON_L1',
  NOT_RECEIVED = 'NOT_RECEIVED',
}

export enum ExecutionStatus {
  SUCCEEDED = 'SUCCEEDED',
  REVERTED = 'REVERTED',
  REJECTED = 'REJECTED',
}

export enum TransactionStatusType { // for retrieving txn from StarkNet feeder gateway
  FINALITY = 'finalityStatus',
  EXECUTION = 'executionStatus',
  DEPRECATION = 'status',
}

export type TranscationAccountCall = {
  contract: string;
  contractFuncName: string;
  contractCallData: string[];
  recipient?: string;
  amount?: string;
};

export type Transaction = {
  txnHash: string; // in hex
  // TEMP: add StarkNetTransactionType as optional to support the legacy data
  txnType: VoyagerTransactionType | string | StarkNetTransactionType;
  chainId: string; // in hex
  // TODO: rename it to address to sync with the same naming convention in the AccContract
  senderAddress: string; // in hex
  contractAddress: string; // in hex
  contractFuncName: string;
  contractCallData: RawCalldata;
  status?: TransactionStatus | string;
  // TEMP: add TransactionFinalityStatus as optional to support the legacy data
  executionStatus?: TransactionStatus | string | TransactionFinalityStatus;
  // TEMP: add TransactionExecutionStatus as optional to support the legacy data
  finalityStatus?: TransactionStatus | string | TransactionExecutionStatus;
  failureReason?: string;
  // TEMP: add it as optional to support the legacy data
  eventIds?: string[];
  timestamp: number;

  // New fields
  // TEMP: put those new fields as optional to support the legacy data
  maxFee?: string | null;
  actualFee?: string | null;
  // using Record<string, TranscationAccountCall[]> to support O(1) searching
  accountCalls?: Record<string, TranscationAccountCall[]> | null;
};

/* eslint-disable */
