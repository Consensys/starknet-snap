import { BigNumber } from 'ethers';

export type Transaction = {
  txnHash: string; // in hex
  txnType: string;
  chainId: string; // in hex
  senderAddress: string; // in hex
  contractAddress: string; // in hex
  contractFuncName: string;
  contractCallData: string[] | number[];
  status?: TransactionStatus | string;
  executionStatus?: TransactionStatus | string;
  finalityStatus?: TransactionStatus | string;
  failureReason: string;
  eventIds: string[];
  timestamp: number;
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
