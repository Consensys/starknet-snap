import { toJson } from './serializer';
import { Mutex } from 'async-mutex';
import {
  num,
  InvocationsDetails,
  DeclareContractPayload,
  Abi,
  DeclareSignerDetails,
  Call,
  DeployAccountSignerDetails,
  constants,
} from 'starknet';
import { validateAndParseAddress } from './starknetUtils';
import { Component, text, copyable, panel, heading, DialogType } from '@metamask/snaps-sdk';
import {
  Network,
  Erc20Token,
  AccContract,
  SnapState,
  Transaction,
  VoyagerTransactionType,
  TransactionStatus,
} from '../types/snapState';
import {
  DAPP,
  MAXIMUM_NETWORK_NAME_LENGTH,
  MAXIMUM_TOKEN_NAME_LENGTH,
  MAXIMUM_TOKEN_SYMBOL_LENGTH,
  PRELOADED_NETWORKS,
  PRELOADED_TOKENS,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from './constants';
import convert from 'ethereum-unit-converter';
import { AddErc20TokenRequestParams, AddNetworkRequestParams } from '../types/snapApi';
import {
  filterTransactions,
  TimestampFilter,
  ContractAddressFilter,
  SenderAddressFilter,
  TxnTypeFilter,
  StatusFilter,
  ChainIdFilter,
} from './transaction/filter';
import { logger } from './logger';

function hasOnlyAsciiChars(str: string) {
  return /^[ -~]+$/.test(str);
}

function isValidAsciiStrField(fieldStr: string, maxLength: number) {
  return hasOnlyAsciiChars(fieldStr) && fieldStr.trim().length > 0 && fieldStr.length <= maxLength;
}

function isHexWithPrefix(str: string) {
  return /^0x[0-9a-fA-F]+$/.test(str);
}

function isValidHttpUrl(urlStr: string) {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function isValidTokenName(tokenName: string) {
  return isValidAsciiStrField(tokenName, MAXIMUM_TOKEN_NAME_LENGTH);
}

function isValidTokenSymbol(tokenSymbol: string) {
  return isValidAsciiStrField(tokenSymbol, MAXIMUM_TOKEN_SYMBOL_LENGTH);
}

function isValidNetworkName(networkName: string) {
  return isValidAsciiStrField(networkName, MAXIMUM_NETWORK_NAME_LENGTH);
}

function isPreloadedTokenName(tokenName: string, chainId: string) {
  return !!PRELOADED_TOKENS.find(
    (token) => token.name.trim() === tokenName.trim() && isSameChainId(token.chainId, chainId),
  );
}

function isPreloadedTokenSymbol(tokenSymbol: string, chainId: string) {
  return !!PRELOADED_TOKENS.find(
    (token) => token.symbol.trim() === tokenSymbol.trim() && isSameChainId(token.chainId, chainId),
  );
}

function isPreloadedTokenAddress(tokenAddress: string, chainId: string) {
  const bigIntTokenAddress = num.toBigInt(tokenAddress);
  return !!PRELOADED_TOKENS.find(
    (token) => num.toBigInt(token.address) === bigIntTokenAddress && isSameChainId(token.chainId, chainId),
  );
}

function isPreloadedNetworkChainId(chainId: string) {
  return !!PRELOADED_NETWORKS.find((network) => isSameChainId(network.chainId, chainId));
}

function isPreloadedNetworkName(networkName: string) {
  return !!PRELOADED_NETWORKS.find((network) => network.name.trim() === networkName.trim());
}

export function validateAddErc20TokenParams(params: AddErc20TokenRequestParams, network: Network) {
  try {
    validateAndParseAddress(params.tokenAddress);
  } catch (err) {
    throw new Error(`The given token address is invalid: ${params.tokenAddress}`);
  }

  if (!isValidTokenName(params.tokenName)) {
    throw new Error(
      `The given token name is invalid, needs to be in ASCII chars, not all spaces, and has length larger than ${MAXIMUM_TOKEN_NAME_LENGTH}: ${params.tokenName}`,
    );
  }

  if (!isValidTokenSymbol(params.tokenSymbol)) {
    throw new Error(
      `The given token symbol is invalid, needs to be in ASCII chars, not all spaces, and has length larger than ${MAXIMUM_TOKEN_SYMBOL_LENGTH}: ${params.tokenSymbol}`,
    );
  }

  if (
    isPreloadedTokenAddress(params.tokenAddress, network.chainId) ||
    isPreloadedTokenName(params.tokenName, network.chainId) ||
    isPreloadedTokenSymbol(params.tokenSymbol, network.chainId)
  ) {
    throw new Error(
      'The given token address, name, or symbol is the same as one of the preloaded tokens, and thus cannot be added',
    );
  }
}

export function validateAddNetworkParams(params: AddNetworkRequestParams) {
  if (!isValidNetworkName(params.networkName)) {
    throw new Error(
      `The given network name is invalid, needs to be in ASCII chars, not all spaces, and has length larger than ${MAXIMUM_NETWORK_NAME_LENGTH}: ${params.networkName}`,
    );
  }

  if (!isHexWithPrefix(params.networkChainId)) {
    throw new Error(`The given network chainId is not in hexadecimal string with prefix: ${params.networkChainId}`);
  }

  if (params.networkBaseUrl && !isValidHttpUrl(params.networkBaseUrl)) {
    throw new Error(`The given network REST API base URL is not an valid HTTP/HTTPS URL: ${params.networkBaseUrl}`);
  }

  if (params.networkNodeUrl && !isValidHttpUrl(params.networkNodeUrl)) {
    throw new Error(`The given network RPC node URL is not an valid HTTP/HTTPS URL: ${params.networkNodeUrl}`);
  }

  if (params.networkVoyagerUrl && !isValidHttpUrl(params.networkVoyagerUrl)) {
    throw new Error(`The given network Voyager URL is not an valid HTTP/HTTPS URL: ${params.networkVoyagerUrl}`);
  }

  if (isPreloadedNetworkChainId(params.networkChainId) || isPreloadedNetworkName(params.networkName)) {
    throw new Error(
      'The given network chainId or name is the same as one of the preloaded networks, and thus cannot be added',
    );
  }
}

export function isSameChainId(chainId1: string, chainId2: string) {
  return num.toBigInt(chainId1) === num.toBigInt(chainId2);
}

export const getValidNumber = (
  obj,
  defaultValue: number,
  minVal: number = Number.MIN_SAFE_INTEGER,
  maxVal: number = Number.MAX_SAFE_INTEGER,
) => {
  const toNum = Number(obj);
  return obj === '' || isNaN(toNum) || toNum > maxVal || toNum < minVal ? defaultValue : toNum;
};

export function addDialogTxt(components: Array<Component>, label: string, value: string) {
  components.push(text(`**${label}:**`));
  components.push(copyable(value));
}

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

export function getTxnSnapTxt(
  senderAddress: string,
  network: Network,
  txnInvocation: Call | Call[],
  abis?: Abi[],
  invocationsDetails?: InvocationsDetails,
) {
  const components = [];
  addDialogTxt(components, 'Network', network.name);
  addDialogTxt(components, 'Signer Address', senderAddress);
  addDialogTxt(components, 'Transaction Invocation', JSON.stringify(txnInvocation, null, 2));
  if (abis && abis.length > 0) {
    addDialogTxt(components, 'Abis', JSON.stringify(abis, null, 2));
  }

  if (invocationsDetails?.maxFee) {
    addDialogTxt(components, 'Max Fee(ETH)', convert(invocationsDetails.maxFee, 'wei', 'ether'));
  }
  if (invocationsDetails?.nonce) {
    addDialogTxt(components, 'Nonce', invocationsDetails.nonce.toString());
  }
  if (invocationsDetails?.version) {
    addDialogTxt(components, 'Version', invocationsDetails.version.toString());
  }
  return components;
}

export function getSendTxnText(
  state: SnapState,
  contractAddress: string,
  contractFuncName: string,
  contractCallData: string[],
  senderAddress: string,
  maxFee: num.BigNumberish,
  network: Network,
): Array<Component> {
  // Retrieve the ERC-20 token from snap state for confirmation display purpose
  const token = getErc20Token(state, contractAddress, network.chainId);
  const components = [];
  addDialogTxt(components, 'Signer Address', senderAddress);
  addDialogTxt(components, 'Contract', contractAddress);
  addDialogTxt(components, 'Call Data', `[${contractCallData.join(', ')}]`);
  addDialogTxt(components, 'Estimated Gas Fee(ETH)', convert(maxFee, 'wei', 'ether'));
  addDialogTxt(components, 'Network', network.name);

  if (token && contractFuncName === 'transfer') {
    try {
      let amount = '';
      if ([3, 6, 9, 12, 15, 18].includes(token.decimals)) {
        amount = convert(contractCallData[1], -1 * token.decimals, 'ether');
      } else {
        amount = (Number(contractCallData[1]) * Math.pow(10, -1 * token.decimals)).toFixed(token.decimals);
      }
      addDialogTxt(components, 'Sender Address', senderAddress);
      addDialogTxt(components, 'Recipient Address', contractCallData[0]);
      addDialogTxt(components, `Amount(${token.symbol})`, amount);
    } catch (err) {
      logger.error(`getSigningTxnText: error found in amount conversion: ${err}`);
    }
  }

  return components;
}

export function getSignTxnTxt(
  signerAddress: string,
  network: Network,
  txnInvocation: Call[] | DeclareSignerDetails | DeployAccountSignerDetails,
) {
  const components = [];
  addDialogTxt(components, 'Network', network.name);
  addDialogTxt(components, 'Signer Address', signerAddress);
  addDialogTxt(components, 'Transaction', JSON.stringify(txnInvocation, null, 2));
  return components;
}

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
      typeof contractPayload.contract === 'string' || contractPayload.contract instanceof String
        ? contractPayload.contract.toString()
        : JSON.stringify(contractPayload.contract, null, 2);
    addDialogTxt(components, 'Contract', _contractPayload);
  }
  if (contractPayload.compiledClassHash) {
    addDialogTxt(components, 'Complied Class Hash', contractPayload.compiledClassHash);
  }
  if (contractPayload.classHash) {
    addDialogTxt(components, 'Class Hash', contractPayload.classHash);
  }
  if (contractPayload.casm) {
    addDialogTxt(components, 'Casm', JSON.stringify(contractPayload.casm, null, 2));
  }
  if (invocationsDetails?.maxFee !== undefined) {
    addDialogTxt(components, 'Max Fee(ETH)', convert(invocationsDetails.maxFee, 'wei', 'ether'));
  }
  if (invocationsDetails?.nonce !== undefined) {
    addDialogTxt(components, 'Nonce', invocationsDetails.nonce.toString());
  }
  if (invocationsDetails?.version !== undefined) {
    addDialogTxt(components, 'Version', invocationsDetails.version.toString());
  }
  return components;
}

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

export function getAccount(state: SnapState, accountAddress: string, chainId: string) {
  const bigIntAccountAddress = num.toBigInt(accountAddress);
  return state.accContracts?.find(
    (acc) => num.toBigInt(acc.address) === bigIntAccountAddress && isSameChainId(acc.chainId, chainId),
  );
}

export function getAccounts(state: SnapState, chainId: string) {
  return state.accContracts
    .filter((acc) => isSameChainId(acc.chainId, chainId))
    .sort((a: AccContract, b: AccContract) => a.addressIndex - b.addressIndex);
}

export async function upsertAccount(userAccount: AccContract, wallet, mutex: Mutex, state: SnapState = undefined) {
  return mutex.runExclusive(async () => {
    if (!state) {
      state = await wallet.request({
        method: 'snap_manageState',
        params: {
          operation: 'get',
        },
      });
    }

    const storedAccount = getAccount(state, userAccount.address, userAccount.chainId);
    if (!storedAccount) {
      if (!state.accContracts) {
        state.accContracts = [];
      }
      state.accContracts.push(userAccount);
    } else {
      if (toJson(storedAccount) === toJson(userAccount)) {
        logger.log(`upsertAccount: same account and hence skip calling snap state update: ${toJson(storedAccount)}`);
        return;
      }
      storedAccount.addressSalt = userAccount.addressSalt;
      storedAccount.addressIndex = userAccount.addressIndex;
      storedAccount.derivationPath = userAccount.derivationPath;
      storedAccount.publicKey = userAccount.publicKey;
      storedAccount.deployTxnHash = userAccount.deployTxnHash || storedAccount.deployTxnHash;
      storedAccount.upgradeRequired = userAccount.upgradeRequired;
    }

    await wallet.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state,
      },
    });
  });
}

export function getNetwork(state: SnapState, chainId: string) {
  return state.networks?.find(
    (network) => isSameChainId(network.chainId, chainId) && !Boolean(network?.useOldAccounts),
  );
}

export function getNetworks(state: SnapState) {
  return state.networks;
}

export async function upsertNetwork(network: Network, wallet, mutex: Mutex, state: SnapState = undefined) {
  return mutex.runExclusive(async () => {
    if (!state) {
      state = await wallet.request({
        method: 'snap_manageState',
        params: {
          operation: 'get',
        },
      });
    }

    const storedNetwork = getNetwork(state, network.chainId);
    if (!storedNetwork) {
      if (!state.networks) {
        state.networks = [];
      }
      state.networks.push(network);
    } else {
      if (toJson(storedNetwork) === toJson(network)) {
        logger.log(`upsertNetwork: same network and hence skip calling snap state update: ${toJson(storedNetwork)}`);
        return;
      }
      storedNetwork.name = network.name;
      storedNetwork.baseUrl = network.baseUrl;
      storedNetwork.nodeUrl = network.nodeUrl;
      storedNetwork.voyagerUrl = network.voyagerUrl;
    }

    await wallet.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state,
      },
    });
  });
}

export async function removeNetwork(network: Network, wallet, mutex: Mutex, state: SnapState = undefined) {
  return mutex.runExclusive(async () => {
    if (!state) {
      state = await wallet.request({
        method: 'snap_manageState',
        params: {
          operation: 'get',
        },
      });
    }

    if (state.currentNetwork && isSameChainId(state.currentNetwork.chainId, network.chainId)) {
      state.currentNetwork = undefined; // fallback to default network
    }

    const storedNetwork = getNetwork(state, network.chainId);
    if (storedNetwork) {
      state.networks = state.networks.filter((net) => !isSameChainId(net.chainId, network.chainId));
      await wallet.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: state,
        },
      });
    }
  });
}

export function getErc20Token(state: SnapState, tokenAddress: string, chainId: string) {
  const bigIntTokenAddress = num.toBigInt(tokenAddress);
  return state.erc20Tokens?.find(
    (token) => num.toBigInt(token.address) === bigIntTokenAddress && isSameChainId(token.chainId, chainId),
  );
}

export function getErc20Tokens(state: SnapState, chainId: string) {
  return state.erc20Tokens?.filter((token) => isSameChainId(token.chainId, chainId));
}

export function getEtherErc20Token(state: SnapState, chainId: string) {
  return state.erc20Tokens?.find((token) => isSameChainId(token.chainId, chainId) && token.symbol === 'ETH');
}

export async function upsertErc20Token(erc20Token: Erc20Token, wallet, mutex: Mutex, state: SnapState = undefined) {
  return mutex.runExclusive(async () => {
    if (!state) {
      state = await wallet.request({
        method: 'snap_manageState',
        params: {
          operation: 'get',
        },
      });
    }

    const storedErc20Token = getErc20Token(state, erc20Token.address, erc20Token.chainId);
    if (!storedErc20Token) {
      if (!state.erc20Tokens) {
        state.erc20Tokens = [];
      }
      state.erc20Tokens.push(erc20Token);
    } else {
      if (toJson(storedErc20Token) === toJson(erc20Token)) {
        logger.log(
          `upsertErc20Token: same Erc20 token and hence skip calling snap state update: ${toJson(storedErc20Token)}`,
        );
        return;
      }
      storedErc20Token.name = erc20Token.name;
      storedErc20Token.symbol = erc20Token.symbol;
      storedErc20Token.decimals = erc20Token.decimals;
    }

    await wallet.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state,
      },
    });
  });
}

export function getNetworkFromChainId(state: SnapState, targerChainId: string | undefined) {
  const chainId = targerChainId || STARKNET_SEPOLIA_TESTNET_NETWORK.chainId;
  const network = getNetwork(state, chainId);
  if (!network) {
    throw new Error(`can't find the network in snap state with chainId: ${chainId}`);
  }
  logger.log(`getNetworkFromChainId: From ${targerChainId}:\n${toJson(network)}`);
  return network;
}

export function getChainIdHex(network: Network) {
  return `0x${num.toBigInt(network.chainId).toString(16)}`;
}

export function getRPCUrl(chainId: string) {
  switch (chainId) {
    case constants.StarknetChainId.SN_MAIN:
      return `https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_7/${getRPCCredentials()}`;
    default:
    case STARKNET_SEPOLIA_TESTNET_NETWORK.chainId:
      return `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/${getRPCCredentials()}`;
  }
}

export function getRPCCredentials(): string {
  return process.env.ALCHEMY_API_KEY ?? '';
}

export function getVoyagerUrl(chainId: string) {
  switch (chainId) {
    case STARKNET_SEPOLIA_TESTNET_NETWORK.chainId:
      return `https://sepolia-api.voyager.online/beta`;
    case constants.StarknetChainId.SN_MAIN:
    default:
      return `https://api.voyager.online/beta`;
  }
}

export function getVoyagerCredentials(): Record<string, string> {
  return {
    'X-API-Key': process.env.VOYAGER_API_KEY,
  };
}

export function getTransactionFromVoyagerUrl(network: Network) {
  return `${getVoyagerUrl(network.chainId)}/txn`;
}

export function getTransactionsFromVoyagerUrl(network: Network) {
  return `${getVoyagerUrl(network.chainId)}/txns`;
}

export function getTransaction(state: SnapState, txnHash: string, chainId: string) {
  const bigIntTxnHash = num.toBigInt(txnHash);
  return state.transactions?.find(
    (txn) => num.toBigInt(txn.txnHash) === bigIntTxnHash && isSameChainId(txn.chainId, chainId),
  );
}

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
      new SenderAddressFilter(senderAddress ? num.toBigInt(senderAddress) : undefined),
      new ContractAddressFilter(contractAddress ? num.toBigInt(contractAddress) : undefined),
      new TxnTypeFilter(txnType),
      new StatusFilter(finalityStatus, executionStatus),
    ]);
  }
  return filteredTxns;
}

export async function upsertTransaction(txn: Transaction, wallet, mutex: Mutex, state: SnapState = undefined) {
  return mutex.runExclusive(async () => {
    if (!state) {
      state = await wallet.request({
        method: 'snap_manageState',
        params: {
          operation: 'get',
        },
      });
    }

    const storedTxn = getTransaction(state, txn.txnHash, txn.chainId);
    if (!storedTxn) {
      if (!state.transactions) {
        state.transactions = [];
      }
      state.transactions.push(txn);
    } else {
      if (toJson(storedTxn) === toJson(txn)) {
        logger.log(
          `upsertTransaction: same transaction and hence skip calling snap state update: ${toJson(storedTxn)}`,
        );
        return;
      }
      storedTxn.status = txn.status;
      storedTxn.executionStatus = txn.executionStatus;
      storedTxn.finalityStatus = txn.finalityStatus;
      storedTxn.failureReason = txn.failureReason;
      storedTxn.timestamp = txn.timestamp;
    }

    await wallet.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state,
      },
    });
  });
}

export async function upsertTransactions(txns: Transaction[], wallet, mutex: Mutex, state: SnapState = undefined) {
  return mutex.runExclusive(async () => {
    if (!state) {
      state = await wallet.request({
        method: 'snap_manageState',
        params: {
          operation: 'get',
        },
      });
    }

    txns.forEach((txn) => {
      const storedTxn = getTransaction(state, txn.txnHash, txn.chainId);
      if (!storedTxn) {
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
    });

    await wallet.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state,
      },
    });
  });
}

export async function removeAcceptedTransaction(
  minTimeStamp: number,
  wallet,
  mutex: Mutex,
  state: SnapState = undefined,
) {
  return mutex.runExclusive(async () => {
    if (!state) {
      state = await wallet.request({
        method: 'snap_manageState',
        params: {
          operation: 'get',
        },
      });
    }

    state.transactions = state.transactions.filter(
      (txn) =>
        (txn.finalityStatus !== TransactionStatus.ACCEPTED_ON_L2 &&
          txn.finalityStatus !== TransactionStatus.ACCEPTED_ON_L1) ||
        (txn.finalityStatus === TransactionStatus.ACCEPTED_ON_L2 && txn.timestamp * 1000 >= minTimeStamp),
    );

    await wallet.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state,
      },
    });
  });
}

export function getCurrentNetwork(state: SnapState) {
  return state.currentNetwork || STARKNET_SEPOLIA_TESTNET_NETWORK;
}

export async function setCurrentNetwork(network: Network, wallet, mutex: Mutex, state: SnapState = undefined) {
  return mutex.runExclusive(async () => {
    if (!state) {
      state = await wallet.request({
        method: 'snap_manageState',
        params: {
          operation: 'get',
        },
      });
    }

    state.currentNetwork = network;

    await wallet.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state,
      },
    });
  });
}

export function toMap<k, v, z>(arr: Array<v>, key: string, keyConverter?: (v: z) => k): Map<k, v> {
  return arr.reduce((map, obj: v) => {
    map.set(keyConverter && typeof keyConverter === 'function' ? keyConverter(obj[key] as z) : obj[key], obj);
    return map;
  }, new Map<k, v>());
}

export function dappUrl(envt: string) {
  if (!envt) {
    return DAPP.prod;
  }

  switch (envt.toLowerCase()) {
    case 'dev':
      return DAPP.dev;
    case 'staging':
      return DAPP.staging;
    case 'prod':
      return DAPP.prod;
    default:
      return DAPP.prod;
  }
}

export async function showUpgradeRequestModal(wallet) {
  await wallet.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Alert,
      content: panel([
        heading('Account Upgrade Mandatory!'),
        text(
          `Visit the [companion dapp for Starknet](${dappUrl(process.env.SNAP_ENV)}) and click “Upgrade”.\nThank you!`,
        ),
      ]),
    },
  });
}
