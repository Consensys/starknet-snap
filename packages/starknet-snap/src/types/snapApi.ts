import { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import Mutex from 'async-mutex/lib/Mutex';
import { SnapState, VoyagerTransactionType } from './snapState';
import {
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
} from 'starknet';

export interface ApiParams {
  state: SnapState;
  requestParams: ApiRequestParams;
  saveMutex: Mutex;
  wallet;
  keyDeriver?: BIP44AddressKeyDeriver;
}

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

export interface BaseRequestParams {
  chainId?: string;
  isDev?: boolean;
  debugLevel?: string;
}

export interface CreateAccountRequestParams extends BaseRequestParams {
  addressIndex?: string | number;
  deploy?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetStoredUserAccountsRequestParams extends BaseRequestParams {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetStoredErc20TokensRequestParams extends BaseRequestParams {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetStoredNetworksRequestParams extends Omit<BaseRequestParams, 'chainId'> {}

export interface ExtractPrivateKeyRequestParams extends BaseRequestParams {
  userAddress: string;
}

export interface ExtractPublicKeyRequestParams extends BaseRequestParams {
  userAddress: string;
}

export interface SignMessageRequestParams extends Autherizeable, SignRequestParams, BaseRequestParams {
  typedDataMessage: typedData.TypedData;
}

export interface VerifySignedMessageRequestParams extends BaseRequestParams {
  signerAddress: string;
  signature: string;
  typedDataMessage?: string;
}

export interface GetErc20TokenBalanceRequestParams extends BaseRequestParams {
  tokenAddress: string;
  userAddress: string;
}

export interface GetTransactionStatusRequestParams extends BaseRequestParams {
  transactionHash: string;
}

export interface SendTransactionRequestParams extends BaseRequestParams {
  contractAddress: string;
  contractFuncName: string;
  contractCallData?: string;
  senderAddress: string;
  maxFee?: string;
}

export interface UpgradeTransactionRequestParams extends BaseRequestParams {
  contractAddress: string;
  maxFee?: string;
}

export interface GetValueRequestParams extends BaseRequestParams {
  contractAddress: string;
  contractFuncName: string;
  contractCallData?: string;
}

export interface EstimateFeeRequestParams extends BaseRequestParams {
  contractAddress: string;
  contractFuncName: string;
  contractCallData?: string;
  senderAddress: string;
}

export interface EstimateAccountDeployFeeRequestParams extends BaseRequestParams {
  addressIndex?: string | number;
}

export interface AddErc20TokenRequestParams extends BaseRequestParams {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals?: string | number;
}

export interface AddNetworkRequestParams extends BaseRequestParams {
  networkName: string;
  networkChainId: string;
  networkBaseUrl: string;
  networkNodeUrl: string;
  networkVoyagerUrl?: string;
  accountClassHash?: string;
}

export interface GetStoredTransactionsRequestParams extends BaseRequestParams {
  senderAddress?: string;
  contractAddress?: string;
  txnType?: VoyagerTransactionType | string;
  txnsInLastNumOfDays?: string | number;
}

export interface GetTransactionsRequestParams extends BaseRequestParams {
  senderAddress?: string;
  contractAddress?: string;
  pageSize?: string | number;
  txnsInLastNumOfDays?: string | number;
  onlyFromState?: boolean;
  withDeployTxn?: boolean;
}

export interface RecoverAccountsRequestParams extends BaseRequestParams {
  startScanIndex?: string | number;
  maxScanned?: string | number;
  maxMissed?: string | number;
}

export interface ExecuteTxnRequestParams extends BaseRequestParams {
  senderAddress: string;
  txnInvocation: Call | Call[];
  abis?: Abi[];
  invocationsDetails?: InvocationsDetails;
}

export interface EstimateFeesRequestParams extends BaseRequestParams {
  senderAddress: string;
  invocations: Invocations;
  invocationDetails?: EstimateFeeDetails;
}

export interface DeclareContractRequestParams extends BaseRequestParams {
  senderAddress: string;
  contractPayload: DeclareContractPayload;
  invocationsDetails?: InvocationsDetails;
}

export interface RpcV4GetTransactionReceiptResponse {
  execution_status?: string;
  finality_status?: string;
}

export interface Autherizeable {
  enableAutherize?: boolean;
}

export interface SignRequestParams {
  signerAddress: string;
}

export interface SignTransactionRequestParams extends Autherizeable, SignRequestParams, BaseRequestParams {
  transactions: Call[];
  transactionsDetail: InvocationsSignerDetails;
  abis?: Abi[];
}

export interface SignDeployAccountTransactionRequestParams extends Autherizeable, SignRequestParams, BaseRequestParams {
  transaction: DeployAccountSignerDetails;
}

export interface SignDeclareTransactionRequestParams extends Autherizeable, SignRequestParams, BaseRequestParams {
  transaction: DeclareSignerDetails;
}

export interface SwitchNetworkRequestParams extends Autherizeable, BaseRequestParams {
  chainId: string;
}

export interface GetStarkNameRequestParam extends BaseRequestParams {
  userAddress: string;
}
