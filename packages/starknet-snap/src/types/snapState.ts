import { RawCalldata } from 'starknet';

export interface SnapState {
  accContracts: AccContract[];
  erc20Tokens: Erc20Token[];
  networks: Network[];
  transactions: Transaction[];
}

export interface AccContract {
  addressSalt: string;
  publicKey: string; // in hex
  address: string; // in hex
  addressIndex: number;
  derivationPath: string;
  deployTxnHash: string; // in hex
  chainId: string; // in hex
}

export interface Erc20Token {
  address: string; // in hex
  name: string;
  symbol: string;
  decimals: number;
  chainId: string; // in hex
}

export interface Network {
  name: string;
  chainId: string; // in hex
  baseUrl: string;
  nodeUrl: string;
  voyagerUrl: string;
  accountClassHash: string; // in hex
  useOldAccounts?: boolean;
}

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

export interface Transaction {
  txnHash: string; // in hex
  txnType: VoyagerTransactionType | string;
  chainId: string; // in hex
  senderAddress: string; // in hex
  contractAddress: string; // in hex
  contractFuncName: string;
  contractCallData: RawCalldata;
  status?: TransactionStatus | string;
  executionStatus?: TransactionStatus | string;
  finalityStatus?: TransactionStatus | string;
  failureReason: string;
  eventIds: string[];
  timestamp: number;
}
