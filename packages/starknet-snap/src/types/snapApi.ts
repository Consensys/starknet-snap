import type { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import type Mutex from 'async-mutex/lib/Mutex';
import type {
  Abi,
  Call,
  InvocationsSignerDetails,
  DeclareContractPayload,
  InvocationsDetails,
  Invocations,
  EstimateFeeDetails,
  DeployAccountSignerDetails,
  DeclareSignerDetails,
  typedData,
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
  | ExtractPrivateKeyRequestParams
  | ExtractPublicKeyRequestParams
  | SignMessageRequestParams
  | VerifySignedMessageRequestParams
  | GetErc20TokenBalanceRequestParams
  | GetTransactionStatusRequestParams
  | SendTransactionRequestParams
  | GetValueRequestParams
  | EstimateFeeRequestParams
  | EstimateAccountDeployFeeRequestParams
  | AddErc20TokenRequestParams
  | GetStoredErc20TokensRequestParams
  | AddNetworkRequestParams
  | GetStoredNetworksRequestParams
  | GetStoredTransactionsRequestParams
  | GetTransactionsRequestParams
  | RecoverAccountsRequestParams
  | ExecuteTxnRequestParams
  | EstimateFeesRequestParams
  | DeclareContractRequestParams
  | SignTransactionRequestParams;

export type BaseRequestParams = {
  chainId?: string;
  isDev?: boolean;
  debugLevel?: string;
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

export type ExtractPrivateKeyRequestParams = {
  userAddress: string;
} & BaseRequestParams;

export type ExtractPublicKeyRequestParams = {
  userAddress: string;
} & BaseRequestParams;

export type SignMessageRequestParams = {
  typedDataMessage: typeof typedData.TypedData;
} & Authorizable &
  SignRequestParams &
  BaseRequestParams;

export type VerifySignedMessageRequestParams = {
  signerAddress: string;
  signature: string;
  typedDataMessage?: string;
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
} & BaseRequestParams;

export type EstimateAccountDeployFeeRequestParams = {
  addressIndex?: string | number;
} & BaseRequestParams;

export type AddErc20TokenRequestParams = {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals?: string | number;
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

export type ExecuteTxnRequestParams = {
  senderAddress: string;
  txnInvocation: Call | Call[];
  abis?: Abi[];
  invocationsDetails?: InvocationsDetails;
} & BaseRequestParams;

export type EstimateFeesRequestParams = {
  senderAddress: string;
  invocations: Invocations;
  invocationDetails?: EstimateFeeDetails;
} & BaseRequestParams;

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

export type SignTransactionRequestParams = {
  transactions: Call[];
  transactionsDetail: InvocationsSignerDetails;
} & Authorizable &
  SignRequestParams &
  BaseRequestParams;

export type SignDeployAccountTransactionRequestParams = {
  transaction: DeployAccountSignerDetails;
} & Authorizable &
  SignRequestParams &
  BaseRequestParams;

export type SignDeclareTransactionRequestParams = {
  transaction: DeclareSignerDetails;
} & Authorizable &
  SignRequestParams &
  BaseRequestParams;

export type SwitchNetworkRequestParams = {
  chainId: string;
} & Authorizable &
  BaseRequestParams;

export type GetStarkNameRequestParam = {
  userAddress: string;
} & BaseRequestParams;

/* eslint-disable */
