import type { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import type Mutex from 'async-mutex/lib/Mutex';
import type {
  DeclareContractPayload,
  InvocationsDetails,
  Invocations,
  EstimateFeeDetails,
  DeployAccountSignerDetails,
  constants,
} from 'starknet';

import type { SnapState, VoyagerTransactionType } from './snapState';
/* eslint-disable */
export type ApiParams = {
  state: SnapState;
  requestParams: ApiRequestParams;
  saveMutex: Mutex;
  wallet;
  keyDeriver?: BIP44AddressKeyDeriver;
};

export type ApiParamsWithKeyDeriver = ApiParams & {
  keyDeriver: BIP44AddressKeyDeriver;
};

export type ApiRequestParams =
  | CreateAccountRequestParams
  | GetStoredUserAccountsRequestParams
  | ExtractPublicKeyRequestParams
  | GetErc20TokenBalanceRequestParams
  | GetTransactionStatusRequestParams
  | SendTransactionRequestParams
  | GetValueRequestParams
  | EstimateFeeRequestParams
  | EstimateAccountDeployFeeRequestParams
  | GetStoredErc20TokensRequestParams
  | AddNetworkRequestParams
  | GetStoredNetworksRequestParams
  | GetStoredTransactionsRequestParams
  | GetTransactionsRequestParams
  | RecoverAccountsRequestParams
  | EstimateFeesRequestParams
  | DeclareContractRequestParams;

export type BaseRequestParams = {
  chainId?: string;
};

export type TransactionVersionParams = {
  transactionVersion?:
    | typeof constants.TRANSACTION_VERSION.V2
    | typeof constants.TRANSACTION_VERSION.V3;
};

export type CreateAccountRequestParams = {
  addressIndex?: string | number;
  deploy?: boolean;
} & BaseRequestParams;

export type GetStoredUserAccountsRequestParams = BaseRequestParams;

export type GetStoredErc20TokensRequestParams = BaseRequestParams;

export type GetStoredNetworksRequestParams = Omit<BaseRequestParams, 'chainId'>;

export type ExtractPublicKeyRequestParams = {
  userAddress: string;
} & BaseRequestParams;

export type GetErc20TokenBalanceRequestParams = {
  tokenAddress: string;
  userAddress: string;
} & BaseRequestParams;

export type GetTransactionStatusRequestParams = {
  transactionHash: string;
} & BaseRequestParams;

export type SendTransactionRequestParams = {
  contractAddress: string;
  contractFuncName: string;
  contractCallData?: string;
  senderAddress: string;
  maxFee?: string;
} & BaseRequestParams;

export type UpgradeTransactionRequestParams = {
  contractAddress: string;
  maxFee?: string;
} & BaseRequestParams;

export type GetValueRequestParams = {
  contractAddress: string;
  contractFuncName: string;
  contractCallData?: string;
} & BaseRequestParams;

export type EstimateFeeRequestParams = {
  contractAddress: string;
  contractFuncName: string;
  contractCallData?: string;
  senderAddress: string;
} & BaseRequestParams &
  TransactionVersionParams;

export type EstimateAccountDeployFeeRequestParams = {
  addressIndex?: string | number;
} & BaseRequestParams;

export type AddNetworkRequestParams = {
  networkName: string;
  networkChainId: string;
  networkBaseUrl: string;
  networkNodeUrl: string;
  networkVoyagerUrl?: string;
  accountClassHash?: string;
} & BaseRequestParams;

export type GetStoredTransactionsRequestParams = {
  senderAddress?: string;
  contractAddress?: string;
  txnType?: VoyagerTransactionType | string;
  txnsInLastNumOfDays?: string | number;
} & BaseRequestParams;

export type GetTransactionsRequestParams = {
  senderAddress?: string;
  contractAddress?: string;
  pageSize?: string | number;
  txnsInLastNumOfDays?: string | number;
  onlyFromState?: boolean;
  withDeployTxn?: boolean;
} & BaseRequestParams;

export type RecoverAccountsRequestParams = {
  startScanIndex?: string | number;
  maxScanned?: string | number;
  maxMissed?: string | number;
} & BaseRequestParams;

export type EstimateFeesRequestParams = {
  senderAddress: string;
  invocations: Invocations;
  invocationDetails?: EstimateFeeDetails;
} & BaseRequestParams &
  TransactionVersionParams;

export type DeclareContractRequestParams = {
  senderAddress: string;
  contractPayload: DeclareContractPayload;
  invocationsDetails?: InvocationsDetails;
} & BaseRequestParams;

export type RpcV4GetTransactionReceiptResponse = {
  execution_status?: string;
  finality_status?: string;
};

export type Authorizable = {
  enableAuthorize?: boolean;
};

export type SignRequestParams = {
  signerAddress: string;
};

export type SignDeployAccountTransactionRequestParams = {
  transaction: DeployAccountSignerDetails;
} & Authorizable &
  SignRequestParams &
  BaseRequestParams;

export type GetStarkNameRequestParam = {
  userAddress: string;
} & BaseRequestParams;

export enum FeeToken {
  ETH = 'ETH',
  STRK = 'STRK',
}

export enum FeeTokenUnit {
  ETH = 'wei',
  STRK = 'fri',
}

export type GetAddrFromStarkNameRequestParam = {
  starkName: string;
} & BaseRequestParams;

/* eslint-enable */
