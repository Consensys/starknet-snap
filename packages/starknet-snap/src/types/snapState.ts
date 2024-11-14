import type { Calldata, EstimateFee, RawArgs, RawCalldata } from 'starknet';

/* eslint-disable */
export type SnapState = {
  accContracts: AccContract[];
  erc20Tokens: Erc20Token[];
  networks: Network[];
  transactions: Transaction[];
  currentNetwork?: Network;
  transactionRequests?: TransactionRequest[];
};

export type FormattedCallData = {
  type: 'contract';
  label: string;
  contractAddress: string;
  chainId: string;
  calldata?: RawArgs | Calldata;
  entrypoint: string;
  isTransfer?: boolean; // Flag to indicate if this call is a transfer
  senderAddress?: string;
  recipientAddress?: string;
  amount?: string;
  decimals?: number;
  tokenSymbol?: string;
};

type ResourceBounds = Pick<EstimateFee, 'resourceBounds'>['resourceBounds'];

export type TransactionRequest = {
  id: string;
  interfaceId: string;
  type: string;
  signer: string;
  chainId: string;
  maxFee: string;
  calls: FormattedCallData[];
  resourceBounds: ResourceBounds[];
  feeToken: string;
  includeDeploy: boolean;
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

export type Transaction = {
  txnHash: string; // in hex
  // TODO: Change the type of txnType to `TransactionType` in the SnapState, when this state manager apply to getTransactions, there is no migration neeeded, as the state is override for every fetch for getTransactions
  txnType: VoyagerTransactionType | string;
  chainId: string; // in hex
  // TODO: rename it to address to sync with the same naming convention in the AccContract
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
};

/* eslint-disable */
