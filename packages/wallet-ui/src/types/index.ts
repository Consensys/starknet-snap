import * as Types from '@consensys/starknet-snap/src/types/snapState';
import { BigNumber } from 'ethers';

export type Account = Pick<
  Types.AccContract,
  'address' | 'publicKey' | 'upgradeRequired' | 'deployRequired'
>;
export type Network = Pick<
  Types.Network,
  'name' | 'chainId' | 'baseUrl' | 'nodeUrl'
>;

export interface Erc20TokenBalance extends Types.Erc20Token {
  amount: BigNumber;
  usdPrice?: number;
  spendableAmount?: BigNumber;
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

export type {
  Erc20Token,
  Transaction,
} from '@consensys/starknet-snap/src/types/snapState';

// Define the type for your token balances
export interface TokenBalance {
  balancePending: BigNumber;
  balanceLatest: BigNumber;
}

export enum FeeToken { // for retrieving txns from Voyager
  ETH = 'ETH',
  STRK = 'STRK',
}
