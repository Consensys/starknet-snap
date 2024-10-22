import type { Component, Json, SnapsProvider } from '@metamask/snaps-sdk';
import { text, copyable, heading } from '@metamask/snaps-sdk';
import type { Mutex } from 'async-mutex';
import convert from 'ethereum-unit-converter';
import { num as numUtils, constants } from 'starknet';
import type {
  InvocationsDetails,
  DeclareContractPayload,
  Abi,
  DeclareSignerDetails,
  Call,
  DeployAccountSignerDetails,
  Invocations,
  UniversalDetails,
} from 'starknet';

import { Config } from '../config';
import { FeeToken, type AddNetworkRequestParams } from '../types/snapApi';
import { TransactionStatus } from '../types/snapState';
import type {
  Network,
  Erc20Token,
  AccContract,
  SnapState,
  Transaction,
  VoyagerTransactionType,
} from '../types/snapState';
import {
  MAXIMUM_NETWORK_NAME_LENGTH,
  PRELOADED_NETWORKS,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from './constants';
import { DeployRequiredError, UpgradeRequiredError } from './exceptions';
import { logger } from './logger';
import { toJson } from './serializer';
import { alertDialog } from './snap';
import { validateAccountRequireUpgradeOrDeploy } from './starknetUtils';
import { isValidAsciiStrField } from './string';
import {
  filterTransactions,
  TimestampFilter,
  ContractAddressFilter,
  SenderAddressFilter,
  TxnTypeFilter,
  StatusFilter,
  ChainIdFilter,
} from './transaction/filter';
import { getDappUrl } from './url';

/**
 *
 * @param wallet
 */
async function getState(wallet: SnapsProvider): Promise<SnapState> {
  return (await wallet.request({
    method: 'snap_manageState',
    params: {
      operation: 'get',
    },
  })) as unknown as SnapState;
}

/**
 *
 * @param wallet
 * @param state
 */
async function setState(
  wallet: SnapsProvider,
  state: SnapState,
): Promise<void> {
  await wallet.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: state as unknown as Record<string, Json>,
    },
  });
}

/**
 *
 * @param str
 */
function isHexWithPrefix(str: string) {
  return /^0x[0-9a-fA-F]+$/u.test(str);
}

/**
 *
 * @param urlStr
 */
function isValidHttpUrl(urlStr: string) {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

/**
 *
 * @param networkName
 */
function isValidNetworkName(networkName: string) {
  return isValidAsciiStrField(networkName, MAXIMUM_NETWORK_NAME_LENGTH);
}

/**
 *
 * @param chainId
 */
function isPreloadedNetworkChainId(chainId: string) {
  return Boolean(
    PRELOADED_NETWORKS.find((network) =>
      isSameChainId(network.chainId, chainId),
    ),
  );
}

/**
 *
 * @param networkName
 */
function isPreloadedNetworkName(networkName: string) {
  return Boolean(
    PRELOADED_NETWORKS.find(
      (network) => network.name.trim() === networkName.trim(),
    ),
  );
}

/**
 *
 * @param params
 */
export function validateAddNetworkParams(params: AddNetworkRequestParams) {
  if (!isValidNetworkName(params.networkName)) {
    throw new Error(
      `The given network name is invalid, needs to be in ASCII chars, not all spaces, and has length larger than ${MAXIMUM_NETWORK_NAME_LENGTH}: ${params.networkName}`,
    );
  }

  if (!isHexWithPrefix(params.networkChainId)) {
    throw new Error(
      `The given network chainId is not in hexadecimal string with prefix: ${params.networkChainId}`,
    );
  }

  if (params.networkBaseUrl && !isValidHttpUrl(params.networkBaseUrl)) {
    throw new Error(
      `The given network REST API base URL is not an valid HTTP/HTTPS URL: ${params.networkBaseUrl}`,
    );
  }

  if (params.networkNodeUrl && !isValidHttpUrl(params.networkNodeUrl)) {
    throw new Error(
      `The given network RPC node URL is not an valid HTTP/HTTPS URL: ${params.networkNodeUrl}`,
    );
  }

  if (params.networkVoyagerUrl && !isValidHttpUrl(params.networkVoyagerUrl)) {
    throw new Error(
      `The given network Voyager URL is not an valid HTTP/HTTPS URL: ${params.networkVoyagerUrl}`,
    );
  }

  if (
    isPreloadedNetworkChainId(params.networkChainId) ||
    isPreloadedNetworkName(params.networkName)
  ) {
    throw new Error(
      'The given network chainId or name is the same as one of the preloaded networks, and thus cannot be added',
    );
  }
}

/**
 *
 * @param chainId1
 * @param chainId2
 */
export function isSameChainId(chainId1: string, chainId2: string) {
  return numUtils.toBigInt(chainId1) === numUtils.toBigInt(chainId2);
}

export const getValidNumber = (
  obj,
  defaultValue: number,
  minVal: number = Number.MIN_SAFE_INTEGER,
  maxVal: number = Number.MAX_SAFE_INTEGER,
) => {
  const toNum = Number(obj);
  return obj === '' || isNaN(toNum) || toNum > maxVal || toNum < minVal
    ? defaultValue
    : toNum;
};

/**
 *
 * @param components
 * @param label
 * @param value
 */
export function addDialogTxt(
  components: Component[],
  label: string,
  value: string,
) {
  components.push(text(`**${label}:**`));
  components.push(copyable(value));
}

/**
 *
 * @param network
 */
export function getNetworkTxt(network: Network) {
  const components = [];
  addDialogTxt(components, 'Chain Name', network.name);
  addDialogTxt(components, 'Chain ID', network.chainId);
  if (network.baseUrl) {
    addDialogTxt(components, 'Base URL', network.baseUrl);
  }
  if (network.nodeUrl) {
    addDialogTxt(components, 'RPC URL', network.nodeUrl);
  }
  if (network.voyagerUrl) {
    addDialogTxt(components, 'Explorer URL', network.voyagerUrl);
  }
  return components;
}

/**
 *
 * @param senderAddress
 * @param network
 * @param invocations
 * @param abis
 * @param details
 */
export function getTxnSnapTxt(
  senderAddress: string,
  network: Network,
  invocations: Invocations | Call | Call[],
  abis?: Abi[],
  details?: UniversalDetails,
) {
  const components = [];
  addDialogTxt(components, 'Network', network.name);
  addDialogTxt(components, 'Signer Address', senderAddress);
  addDialogTxt(
    components,
    'Transaction Invocation',
    JSON.stringify(invocations, null, 2),
  );
  if (abis && abis.length > 0) {
    addDialogTxt(components, 'Abis', JSON.stringify(abis, null, 2));
  }

  if (details?.maxFee) {
    const feeToken: FeeToken =
      details?.version === constants.TRANSACTION_VERSION.V3
        ? FeeToken.STRK
        : FeeToken.ETH;
    addDialogTxt(
      components,
      `Max Fee(${feeToken})`,
      convert(details.maxFee, 'wei', 'ether'),
    );
  }
  if (details?.nonce) {
    addDialogTxt(components, 'Nonce', details.nonce.toString());
  }
  if (details?.version) {
    addDialogTxt(components, 'Version', details.version.toString());
  }
  return components;
}

/**
 *
 * @param state
 * @param contractAddress
 * @param contractFuncName
 * @param contractCallData
 * @param senderAddress
 * @param maxFee
 * @param network
 */
export function getSendTxnText(
  state: SnapState,
  contractAddress: string,
  contractFuncName: string,
  contractCallData: string[],
  senderAddress: string,
  maxFee: numUtils.BigNumberish,
  network: Network,
): Component[] {
  // Retrieve the ERC-20 token from snap state for confirmation display purpose
  const token = getErc20Token(state, contractAddress, network.chainId);
  const components = [];
  addDialogTxt(components, 'Signer Address', senderAddress);
  addDialogTxt(components, 'Contract', contractAddress);
  addDialogTxt(components, 'Call Data', `[${contractCallData.join(', ')}]`);
  addDialogTxt(
    components,
    'Estimated Gas Fee(ETH)',
    convert(maxFee, 'wei', 'ether'),
  );
  addDialogTxt(components, 'Network', network.name);

  if (token && contractFuncName === 'transfer') {
    try {
      let amount = '';
      if ([3, 6, 9, 12, 15, 18].includes(token.decimals)) {
        amount = convert(contractCallData[1], -1 * token.decimals, 'ether');
      } else {
        amount = (
          Number(contractCallData[1]) * Math.pow(10, -1 * token.decimals)
        ).toFixed(token.decimals);
      }
      addDialogTxt(components, 'Sender Address', senderAddress);
      addDialogTxt(components, 'Recipient Address', contractCallData[0]);
      addDialogTxt(components, `Amount(${token.symbol})`, amount);
    } catch (error) {
      logger.error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `getSigningTxnText: error found in amount conversion: ${error}`,
      );
    }
  }
  if (contractFuncName === 'deploy') {
    // [TODO] handle specific deploy dialog aspects ?
  }

  return components;
}

/**
 *
 * @param signerAddress
 * @param network
 * @param txnInvocation
 */
export function getSignTxnTxt(
  signerAddress: string,
  network: Network,
  txnInvocation: Call[] | DeclareSignerDetails | DeployAccountSignerDetails,
) {
  const components = [];
  addDialogTxt(components, 'Network', network.name);
  addDialogTxt(components, 'Signer Address', signerAddress);
  addDialogTxt(
    components,
    'Transaction',
    JSON.stringify(txnInvocation, null, 2),
  );
  return components;
}

/**
 *
 * @param senderAddress
 * @param network
 * @param contractPayload
 * @param invocationsDetails
 */
export function getDeclareSnapTxt(
  senderAddress: string,
  network: Network,
  contractPayload: DeclareContractPayload,
  invocationsDetails?: InvocationsDetails,
) {
  const components = [];
  addDialogTxt(components, 'Network', network.name);
  addDialogTxt(components, 'Signer Address', senderAddress);

  if (contractPayload.contract) {
    const _contractPayload =
      typeof contractPayload.contract === 'string' ||
      contractPayload.contract instanceof String
        ? contractPayload.contract.toString()
        : JSON.stringify(contractPayload.contract, null, 2);
    addDialogTxt(components, 'Contract', _contractPayload);
  }
  if (contractPayload.compiledClassHash) {
    addDialogTxt(
      components,
      'Complied Class Hash',
      contractPayload.compiledClassHash,
    );
  }
  if (contractPayload.classHash) {
    addDialogTxt(components, 'Class Hash', contractPayload.classHash);
  }
  if (contractPayload.casm) {
    addDialogTxt(
      components,
      'Casm',
      JSON.stringify(contractPayload.casm, null, 2),
    );
  }
  if (invocationsDetails?.maxFee !== undefined) {
    addDialogTxt(
      components,
      'Max Fee(ETH)',
      convert(invocationsDetails.maxFee, 'wei', 'ether'),
    );
  }
  if (invocationsDetails?.nonce !== undefined) {
    addDialogTxt(components, 'Nonce', invocationsDetails.nonce.toString());
  }
  if (invocationsDetails?.version !== undefined) {
    addDialogTxt(components, 'Version', invocationsDetails.version.toString());
  }
  return components;
}

/**
 *
 * @param tokenAddress
 * @param tokenName
 * @param tokenSymbol
 * @param tokenDecimals
 * @param network
 */
export function getAddTokenText(
  tokenAddress: string,
  tokenName: string,
  tokenSymbol: string,
  tokenDecimals: number,
  network: Network,
) {
  const components = [];
  addDialogTxt(components, 'Network', network.name);
  addDialogTxt(components, 'Token Address', tokenAddress);
  addDialogTxt(components, 'Token Name', tokenName);
  addDialogTxt(components, 'Token Symbol', tokenSymbol);
  addDialogTxt(components, 'Token Decimals', tokenDecimals.toString());
  return components;
}

/**
 *
 * @param state
 * @param accountAddress
 * @param chainId
 */
export function getAccount(
  state: SnapState,
  accountAddress: string,
  chainId: string,
) {
  const bigIntAccountAddress = numUtils.toBigInt(accountAddress);
  return state.accContracts?.find(
    (acc) =>
      numUtils.toBigInt(acc.address) === bigIntAccountAddress &&
      isSameChainId(acc.chainId, chainId),
  );
}

/**
 *
 * @param state
 * @param chainId
 */
export function getAccounts(state: SnapState, chainId: string) {
  return state.accContracts
    .filter((acc) => isSameChainId(acc.chainId, chainId))
    .sort((a: AccContract, b: AccContract) => a.addressIndex - b.addressIndex);
}

/**
 *
 * @param userAccount
 * @param wallet
 * @param mutex
 * @param state
 */
export async function upsertAccount(
  userAccount: AccContract,
  wallet: SnapsProvider,
  mutex: Mutex,
  state?: SnapState,
) {
  return mutex.runExclusive(async () => {
    if (!state) {
      // eslint-disable-next-line require-atomic-updates, no-param-reassign
      state = await getState(wallet);
    }

    const storedAccount = getAccount(
      state,
      userAccount.address,
      userAccount.chainId,
    );
    if (storedAccount === undefined) {
      if (!state.accContracts) {
        state.accContracts = [];
      }
      state.accContracts.push(userAccount);
    } else {
      if (toJson(storedAccount) === toJson(userAccount)) {
        logger.log(
          `upsertAccount: same account and hence skip calling snap state update: ${toJson(
            storedAccount,
          )}`,
        );
        return;
      }
      storedAccount.addressSalt = userAccount.addressSalt;
      storedAccount.addressIndex = userAccount.addressIndex;
      storedAccount.derivationPath = userAccount.derivationPath;
      storedAccount.publicKey = userAccount.publicKey;
      storedAccount.deployTxnHash =
        userAccount.deployTxnHash || storedAccount.deployTxnHash;
      storedAccount.upgradeRequired = userAccount.upgradeRequired;
      storedAccount.deployRequired = userAccount.deployRequired;
    }

    await setState(wallet, state);
  });
}

/**
 *
 * @param state
 * @param chainId
 */
export function getNetwork(state: SnapState, chainId: string) {
  return state.networks?.find(
    (network) =>
      isSameChainId(network.chainId, chainId) && !network?.useOldAccounts,
  );
}

/**
 *
 * @param state
 */
export function getNetworks(state: SnapState) {
  return state.networks;
}

/**
 *
 * @param network
 * @param wallet
 * @param mutex
 * @param state
 */
export async function upsertNetwork(
  network: Network,
  wallet: SnapsProvider,
  mutex: Mutex,
  state?: SnapState,
) {
  return mutex.runExclusive(async () => {
    if (!state) {
      // eslint-disable-next-line require-atomic-updates, no-param-reassign
      state = await getState(wallet);
    }

    const storedNetwork = getNetwork(state, network.chainId);

    if (storedNetwork === undefined) {
      if (!state.networks) {
        state.networks = [];
      }
      state.networks.push(network);
    } else {
      if (toJson(storedNetwork) === toJson(network)) {
        logger.log(
          `upsertNetwork: same network and hence skip calling snap state update: ${toJson(
            storedNetwork,
          )}`,
        );
        return;
      }
      storedNetwork.name = network.name;
      storedNetwork.baseUrl = network.baseUrl;
      storedNetwork.nodeUrl = network.nodeUrl;
      storedNetwork.voyagerUrl = network.voyagerUrl;
    }

    await setState(wallet, state);
  });
}

/**
 *
 * @param network
 * @param wallet
 * @param mutex
 * @param state
 */
export async function removeNetwork(
  network: Network,
  wallet: SnapsProvider,
  mutex: Mutex,
  state?: SnapState,
) {
  return mutex.runExclusive(async () => {
    if (!state) {
      // eslint-disable-next-line require-atomic-updates, no-param-reassign
      state = await getState(wallet);
    }

    if (
      state.currentNetwork &&
      isSameChainId(state.currentNetwork.chainId, network.chainId)
    ) {
      state.currentNetwork = undefined; // fallback to default network
    }

    const storedNetwork = getNetwork(state, network.chainId);
    if (storedNetwork) {
      state.networks = state.networks.filter(
        (net) => !isSameChainId(net.chainId, network.chainId),
      );
      await setState(wallet, state);
    }
  });
}

/**
 *
 * @param state
 * @param tokenAddress
 * @param chainId
 */
export function getErc20Token(
  state: SnapState,
  tokenAddress: string,
  chainId: string,
) {
  const bigIntTokenAddress = numUtils.toBigInt(tokenAddress);
  return state.erc20Tokens?.find(
    (token) =>
      numUtils.toBigInt(token.address) === bigIntTokenAddress &&
      isSameChainId(token.chainId, chainId),
  );
}

/**
 *
 * @param state
 * @param chainId
 */
export function getErc20Tokens(state: SnapState, chainId: string) {
  return state.erc20Tokens?.filter((token) =>
    isSameChainId(token.chainId, chainId),
  );
}

/**
 *
 * @param state
 * @param chainId
 */
export function getEtherErc20Token(state: SnapState, chainId: string) {
  return state.erc20Tokens?.find(
    (token) => isSameChainId(token.chainId, chainId) && token.symbol === 'ETH',
  );
}

/**
 *
 * @param erc20Token
 * @param wallet
 * @param mutex
 * @param state
 */
export async function upsertErc20Token(
  erc20Token: Erc20Token,
  wallet: SnapsProvider,
  mutex: Mutex,
  state?: SnapState,
) {
  return mutex.runExclusive(async () => {
    if (!state) {
      // eslint-disable-next-line require-atomic-updates, no-param-reassign
      state = await getState(wallet);
    }

    const storedErc20Token = getErc20Token(
      state,
      erc20Token.address,
      erc20Token.chainId,
    );
    if (storedErc20Token === undefined) {
      if (!state.erc20Tokens) {
        state.erc20Tokens = [];
      }
      state.erc20Tokens.push(erc20Token);
    } else {
      if (toJson(storedErc20Token) === toJson(erc20Token)) {
        logger.log(
          `upsertErc20Token: same Erc20 token and hence skip calling snap state update: ${toJson(
            storedErc20Token,
          )}`,
        );
        return;
      }
      storedErc20Token.name = erc20Token.name;
      storedErc20Token.symbol = erc20Token.symbol;
      storedErc20Token.decimals = erc20Token.decimals;
    }

    await setState(wallet, state);
  });
}

/**
 *
 * @param state
 * @param targerChainId
 */
export function getNetworkFromChainId(
  state: SnapState,
  targerChainId: string | undefined,
) {
  const chainId = targerChainId ?? Config.defaultNetwork.chainId;
  const network = getNetwork(state, chainId);
  if (network === undefined) {
    throw new Error(
      `can't find the network in snap state with chainId: ${chainId}`,
    );
  }
  logger.log(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `getNetworkFromChainId: From ${targerChainId}:\n${toJson(network)}`,
  );
  return network;
}

/**
 *
 * @param network
 */
export function getChainIdHex(network: Network) {
  return `0x${numUtils.toBigInt(network.chainId).toString(16)}`;
}

/**
 *
 * @param chainId
 */
export function getRPCUrl(chainId: string) {
  switch (chainId) {
    case constants.StarknetChainId.SN_MAIN:
      return `https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_7/${getRPCCredentials()}`;
    default:
    case STARKNET_SEPOLIA_TESTNET_NETWORK.chainId:
      return `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/${getRPCCredentials()}`;
  }
}

/**
 *
 */
export function getRPCCredentials(): string {
  // eslint-disable-next-line no-restricted-globals
  return process.env.ALCHEMY_API_KEY ?? '';
}

/**
 *
 * @param chainId
 */
export function getVoyagerUrl(chainId: string) {
  switch (chainId) {
    case STARKNET_SEPOLIA_TESTNET_NETWORK.chainId:
      return `https://sepolia-api.voyager.online/beta`;
    case constants.StarknetChainId.SN_MAIN:
    default:
      return `https://api.voyager.online/beta`;
  }
}

/**
 *
 */
export function getVoyagerCredentials(): Record<string, string> {
  return {
    // eslint-disable-next-line no-restricted-globals
    'X-API-Key': process.env.VOYAGER_API_KEY as unknown as string,
  };
}

/**
 *
 * @param network
 */
export function getTransactionFromVoyagerUrl(network: Network) {
  return `${getVoyagerUrl(network.chainId)}/txn`;
}

/**
 *
 * @param network
 */
export function getTransactionsFromVoyagerUrl(network: Network) {
  return `${getVoyagerUrl(network.chainId)}/txns`;
}

/**
 *
 * @param state
 * @param txnHash
 * @param chainId
 */
export function getTransaction(
  state: SnapState,
  txnHash: string,
  chainId: string,
) {
  const bigIntTxnHash = numUtils.toBigInt(txnHash);
  return state.transactions?.find(
    (txn) =>
      numUtils.toBigInt(txn.txnHash) === bigIntTxnHash &&
      isSameChainId(txn.chainId, chainId),
  );
}

/**
 *
 * @param state
 * @param chainId
 * @param senderAddress
 * @param contractAddress
 * @param txnType
 * @param finalityStatus
 * @param executionStatus
 * @param minTimestamp
 */
export function getTransactions(
  state: SnapState,
  chainId: string,
  senderAddress: string | undefined,
  contractAddress: string | undefined,
  txnType: VoyagerTransactionType | string | string[] | undefined,
  finalityStatus: string | string[] | undefined,
  executionStatus: string | string[] | undefined,
  minTimestamp: number | undefined, // in ms
): Transaction[] {
  let filteredTxns: Transaction[] = [];
  if (state.transactions) {
    filteredTxns = filterTransactions(state.transactions, [
      new ChainIdFilter(chainId),
      new TimestampFilter(minTimestamp),
      new SenderAddressFilter(
        senderAddress ? numUtils.toBigInt(senderAddress) : undefined,
      ),
      new ContractAddressFilter(
        contractAddress ? numUtils.toBigInt(contractAddress) : undefined,
      ),
      new TxnTypeFilter(txnType),
      new StatusFilter(finalityStatus, executionStatus),
    ]);
  }
  return filteredTxns;
}

/**
 *
 * @param txn
 * @param wallet
 * @param mutex
 * @param state
 */
export async function upsertTransaction(
  txn: Transaction,
  wallet: SnapsProvider,
  mutex: Mutex,
  state?: SnapState,
) {
  return mutex.runExclusive(async () => {
    if (!state) {
      // eslint-disable-next-line require-atomic-updates, no-param-reassign
      state = await getState(wallet);
    }

    const storedTxn = getTransaction(state, txn.txnHash, txn.chainId);
    if (storedTxn === undefined) {
      if (!state.transactions) {
        state.transactions = [];
      }
      state.transactions.push(txn);
    } else {
      if (toJson(storedTxn) === toJson(txn)) {
        logger.log(
          `upsertTransaction: same transaction and hence skip calling snap state update: ${toJson(
            storedTxn,
          )}`,
        );
        return;
      }
      storedTxn.status = txn.status;
      storedTxn.executionStatus = txn.executionStatus;
      storedTxn.finalityStatus = txn.finalityStatus;
      storedTxn.failureReason = txn.failureReason;
      storedTxn.timestamp = txn.timestamp;
    }

    await setState(wallet, state);
  });
}

/**
 *
 * @param txns
 * @param wallet
 * @param mutex
 * @param state
 */
export async function upsertTransactions(
  txns: Transaction[],
  wallet: SnapsProvider,
  mutex: Mutex,
  state?: SnapState,
) {
  return mutex.runExclusive(async () => {
    if (!state) {
      // eslint-disable-next-line require-atomic-updates, no-param-reassign
      state = await getState(wallet);
    }

    for (const txn of txns) {
      const storedTxn = getTransaction(state, txn.txnHash, txn.chainId);
      if (storedTxn === undefined) {
        if (!state.transactions) {
          state.transactions = [];
        }
        state.transactions.push(txn);
      } else {
        storedTxn.status = txn.status;
        storedTxn.executionStatus = txn.executionStatus;
        storedTxn.finalityStatus = txn.finalityStatus;
        storedTxn.failureReason = txn.failureReason;
        storedTxn.timestamp = txn.timestamp;
      }
    }

    await setState(wallet, state);
  });
}

/**
 *
 * @param minTimeStamp
 * @param wallet
 * @param mutex
 * @param state
 */
export async function removeAcceptedTransaction(
  minTimeStamp: number,
  wallet: SnapsProvider,
  mutex: Mutex,
  state?: SnapState,
) {
  return mutex.runExclusive(async () => {
    if (!state) {
      // eslint-disable-next-line require-atomic-updates, no-param-reassign
      state = await getState(wallet);
    }

    state.transactions = state.transactions.filter(
      (txn) =>
        (txn.finalityStatus !== TransactionStatus.ACCEPTED_ON_L2 &&
          txn.finalityStatus !== TransactionStatus.ACCEPTED_ON_L1) ||
        (txn.finalityStatus === TransactionStatus.ACCEPTED_ON_L2 &&
          txn.timestamp * 1000 >= minTimeStamp),
    );

    await setState(wallet, state);
  });
}

/**
 *
 * @param state
 */
export function getCurrentNetwork(state: SnapState) {
  return state.currentNetwork ?? Config.defaultNetwork;
}

/**
 *
 * @param network
 * @param wallet
 * @param mutex
 * @param state
 */
export async function setCurrentNetwork(
  network: Network,
  wallet: SnapsProvider,
  mutex: Mutex,
  state?: SnapState,
) {
  return mutex.runExclusive(async () => {
    if (!state) {
      // eslint-disable-next-line require-atomic-updates, no-param-reassign
      state = await getState(wallet);
    }

    // eslint-disable-next-line require-atomic-updates
    state.currentNetwork = network;

    await setState(wallet, state);
  });
}

/**
 *
 * @param arr
 * @param mappingKey
 * @param keyConverter
 */
export function toMap<Key, Val, FnParam>(
  arr: Val[],
  mappingKey: string,
  keyConverter?: (v: FnParam) => Key,
): Map<Key, Val> {
  return arr.reduce((map, obj: Val) => {
    map.set(
      keyConverter && typeof keyConverter === 'function'
        ? keyConverter(obj[mappingKey] as FnParam)
        : obj[mappingKey],
      obj,
    );
    return map;
  }, new Map<Key, Val>());
}

/**
 * Displays a modal to the user requesting them to upgrade their account.
 */
export async function showUpgradeRequestModal() {
  await alertDialog([
    heading('Account Upgrade Mandatory!'),
    text(
      `Visit the [companion dapp for Starknet](${getDappUrl()}) and click “Upgrade”.\nThank you!`,
    ),
  ]);
}

/**
 * Displays a modal to the user requesting them to deploy their account.
 */
export async function showDeployRequestModal() {
  await alertDialog([
    heading('Account Deployment Mandatory!'),
    text(
      `Visit the [companion dapp for Starknet](${getDappUrl()}) to deploy your account.\nThank you!`,
    ),
  ]);
}

/**
 * Verifies whether the account needs to be upgraded or deployed and throws an error if necessary.
 *
 * @param network - The network object.
 * @param address - The account address.
 * @param publicKey - The public key of the account address.
 * @param [showAlert] - The flag to show an alert modal; true will show the modal, false will not.
 * @throws {DeployRequiredError} If the account needs to be deployed.
 * @throws {UpgradeRequiredError} If the account needs to be upgraded.
 */
export async function verifyIfAccountNeedUpgradeOrDeploy(
  network: Network,
  address: string,
  publicKey: string,
  showAlert = true,
) {
  try {
    await validateAccountRequireUpgradeOrDeploy(network, address, publicKey);
  } catch (error) {
    if (error instanceof DeployRequiredError) {
      showAlert && (await showDeployRequestModal());
    } else if (error instanceof UpgradeRequiredError) {
      showAlert && (await showUpgradeRequestModal());
    } else {
      logger.warn(
        'Unexpected Error, neither DeployRequiredError or UpgradeRequiredError',
        error,
      );
    }

    throw error;
  }
}
