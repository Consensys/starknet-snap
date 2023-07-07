import * as Types from '@consensys/starknet-snap/src/types/snapState';
import { BigNumber } from 'ethers';

export type Account = Pick<Types.AccContract, 'address' | 'publicKey'>;
export type Network = Pick<Types.Network, 'name' | 'chainId' | 'baseUrl' | 'nodeUrl'>;

export interface Erc20TokenBalance extends Types.Erc20Token {
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

export enum TransactionStatus { // for retrieving txn from StarkNet feeder gateway
  RECEIVED = 'RECEIVED',
  PENDING = 'PENDING',
  ACCEPTED_ON_L2 = 'ACCEPTED_ON_L2',
  ACCEPTED_ON_L1 = 'ACCEPTED_ON_L1',
  NOT_RECEIVED = 'NOT_RECEIVED',
  REJECTED = 'REJECTED',
}

export type { Erc20Token, Transaction } from '@consensys/starknet-snap/src/types/snapState';
