import { BigNumber } from 'ethers';

type AccountCall = {
  contract: string; // HexStruct resolves to a string in this context
  contractFuncName: string;
  contractCallData: string[];
  recipient?: string;
  amount?: string;
};

type AccountCalls = Record<string, AccountCall[]> | null;

export type Transaction = {
  txnHash: string; // in hex
  txnType: string;
  chainId: string; // in hex
  senderAddress: string; // in hex
  contractAddress: string; // in hex
  executionStatus: TransactionStatus | string;
  finalityStatus: TransactionStatus | string;
  failureReason: string;
  actualFee: string | null;
  maxFee: string | null;
  timestamp: number;
  accountCalls: AccountCalls;
  version: number;
  dataVersion: string;
};

export type Account = {
  address: string;
  publicKey: string;
  upgradeRequired: boolean;
  deployRequired: boolean;
};

export type Network = {
  name: string;
  chainId: string;
};

export interface Erc20Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: string;
}

export interface Erc20TokenBalance extends Erc20Token {
  amount: BigNumber;
  usdPrice?: number;
}
export type TransactionStatusOptions =
  | 'Received'
  | 'Pending'
  | 'Accepted on L2'
  | 'Accepted on L1'
  | 'Rejected'
  | 'Not Received';

export enum StarkscanTransactionType {
  DEPLOY = 'DEPLOY',
  DEPLOY_ACCOUNT = 'DEPLOY_ACCOUNT',
  INVOKE = 'INVOKE_FUNCTION',
}

export enum TransactionStatus { // for retrieving txn from Starknet feeder gateway
  NOT_RECEIVED = 'NOT_RECEIVED',
  RECEIVED = 'RECEIVED',
  ACCEPTED_ON_L2 = 'ACCEPTED_ON_L2',
  ACCEPTED_ON_L1 = 'ACCEPTED_ON_L1',
  REJECTED = 'REJECTED',
  REVERTED = 'REVERTED',
  SUCCEEDED = 'SUCCEEDED',
}

export enum BalanceType {
  Spendable = 'spendable',
  Total = 'total',
}

// Define the type for your token balances
export interface TokenBalance {
  balance: BigNumber;
}

export enum FeeToken {
  ETH = 'ETH',
  STRK = 'STRK',
}

export enum FeeTokenUnit {
  ETH = 'wei',
  STRK = 'fri',
}
