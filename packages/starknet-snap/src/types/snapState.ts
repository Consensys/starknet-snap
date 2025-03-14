import type {
  RawCalldata,
  EstimateFee,
  TransactionType as StarknetTransactionType,
} from 'starknet';
import type { Infer } from 'superstruct';

import type { TransactionStruct } from '../utils';

/* eslint-disable */
export type SnapState = {
  accContracts: AccContract[];
  erc20Tokens: Erc20Token[];
  networks: Network[];
  transactions: Transaction[];
  currentNetwork?: Network;
  transactionRequests?: TransactionRequest[];
  currentAccount?: Record<string, AccContract>;
};

export type TokenTransferData = {
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  decimals: number;
  symbol: string;
};

export type FormattedCallData = {
  contractAddress: string;
  calldata?: string[];
  entrypoint: string;
  tokenTransferData?: TokenTransferData;
};

export type ResourceBounds = Pick<
  EstimateFee,
  'resourceBounds'
>['resourceBounds'];

export type ResourceBoundsInBigInt = {
  l1_gas: { max_amount: bigint; max_price_per_unit: bigint };
  l2_gas: { max_amount: bigint; max_price_per_unit: bigint };
};

export type TransactionRequest = {
  id: string;
  interfaceId: string;
  type: StarknetTransactionType;
  signer: string;
  addressIndex: number;
  chainId: string;
  networkName: string;
  maxFee: string;
  calls: FormattedCallData[];
  resourceBounds: ResourceBounds;
  selectedFeeToken: string;
  includeDeploy: boolean;
};

export type AccountMetaData = { accountName?: string };

export type AccContract = {
  addressSalt: string;
  publicKey: string; // in hex
  address: string; // in hex
  addressIndex: number;
  derivationPath?: string;
  deployTxnHash?: string; // in hex
  chainId: string; // in hex
  isDeployed?: boolean;
  upgradeRequired?: boolean;
  deployRequired?: boolean;
  cairoVersion?: string;
} & AccountMetaData;

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

export type LegacyTransaction = {
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
};

export enum TransactionDataVersion {
  V2 = 'V2',
}

export enum ContractFuncName {
  Upgrade = 'upgrade',
  Transfer = 'transfer',
}

export type V2Transaction = Infer<typeof TransactionStruct>;

// FIXME: temp solution for backward compatibility before StarkScan implemented in get transactions
export type Transaction =
  | LegacyTransaction
  | (V2Transaction & { status?: TransactionStatus | string });

/* eslint-disable */
