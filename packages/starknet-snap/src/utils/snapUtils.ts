import { Mutex } from 'async-mutex';
import { number, validateAndParseAddress } from 'starknet';
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
  MAXIMUM_NETWORK_NAME_LENGTH,
  MAXIMUM_TOKEN_NAME_LENGTH,
  MAXIMUM_TOKEN_SYMBOL_LENGTH,
  PRELOADED_NETWORKS,
  PRELOADED_TOKENS,
  STARKNET_TESTNET_NETWORK,
  VOYAGER_API_TXNS_URL_SUFFIX,
  VOYAGER_API_TXN_URL_SUFFIX,
} from './constants';
import convert from 'ethereum-unit-converter';
import { AddErc20TokenRequestParams, AddNetworkRequestParams } from '../types/snapApi';

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
    (token) => token.name.trim() === tokenName.trim() && Number(token.chainId) === Number(chainId),
  );
}

function isPreloadedTokenSymbol(tokenSymbol: string, chainId: string) {
  return !!PRELOADED_TOKENS.find(
    (token) => token.symbol.trim() === tokenSymbol.trim() && Number(token.chainId) === Number(chainId),
  );
}

function isPreloadedTokenAddress(tokenAddress: string, chainId: string) {
  return !!PRELOADED_TOKENS.find(
    (token) => number.toBN(token.address).eq(number.toBN(tokenAddress)) && Number(token.chainId) === Number(chainId),
  );
}

function isPreloadedNetworkChainId(networkChainId: string) {
  return !!PRELOADED_NETWORKS.find((network) => number.toBN(network.chainId).eq(number.toBN(networkChainId)));
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

  if (params.accountClassHash) {
    try {
      validateAndParseAddress(params.accountClassHash);
    } catch (err) {
      throw new Error(`The given account class hash is invalid: ${params.accountClassHash}`);
    }
  }

  if (isPreloadedNetworkChainId(params.networkChainId) || isPreloadedNetworkName(params.networkName)) {
    throw new Error(
      'The given network chainId or name is the same as one of the preloaded networks, and thus cannot be added',
    );
  }
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

export function getSigningTxnText(
  state: SnapState,
  contractAddress: string,
  contractFuncName: string,
  contractCallData: string[],
  senderAddress: string,
  maxFee: number.BigNumberish,
  network: Network,
): string {
  // Retrieve the ERC-20 token from snap state for confirmation display purpose
  const token = getErc20Token(state, contractAddress, network.chainId);
  let tokenTransferStr = '';
  if (token && contractFuncName === 'transfer') {
    try {
      let amount = '';
      if ([3, 6, 9, 12, 15, 18].includes(token.decimals)) {
        amount = convert(contractCallData[1], -1 * token.decimals, 'ether');
      } else {
        amount = (Number(contractCallData[1]) * Math.pow(10, -1 * token.decimals)).toFixed(token.decimals);
      }
      tokenTransferStr = `\nSender Address: ${senderAddress}\nRecipient Address: ${contractCallData[0]}\nAmount(${token.symbol}): ${amount}\n`;
    } catch (err) {
      console.error(`getSigningTxnText: error found in amount conversion: ${err}`);
    }
  }
  return (
    `Contract: ${contractAddress}\nCall Data: [${contractCallData.join(', ')}]\nEstimated Gas Fee(ETH): ${convert(
      maxFee,
      'wei',
      'ether',
    )}\nNetwork: ${network.name}` + tokenTransferStr
  );
}

export function getAccount(state: SnapState, accountAddress: string, chainId: string) {
  return state.accContracts?.find(
    (acc) => number.toBN(acc.address).eq(number.toBN(accountAddress)) && Number(acc.chainId) === Number(chainId),
  );
}

export function getAccounts(state: SnapState, chainId: string) {
  return state.accContracts
    .filter((acc) => Number(acc.chainId) === Number(chainId))
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
      if (JSON.stringify(storedAccount) === JSON.stringify(userAccount)) {
        console.log(
          `upsertAccount: same account and hence skip calling snap state update: ${JSON.stringify(storedAccount)}`,
        );
        return;
      }
      storedAccount.addressSalt = userAccount.addressSalt;
      storedAccount.addressIndex = userAccount.addressIndex;
      storedAccount.derivationPath = userAccount.derivationPath;
      storedAccount.publicKey = userAccount.publicKey;
      storedAccount.deployTxnHash = userAccount.deployTxnHash || storedAccount.deployTxnHash;
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

export function getNetwork(state: SnapState, chainId: string, useOldAccounts = false) {
  return state.networks?.find(
    (network) => Number(network.chainId) === Number(chainId) && !!network?.useOldAccounts === useOldAccounts,
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

    const storedNetwork = getNetwork(state, network.chainId, network.useOldAccounts);
    if (!storedNetwork) {
      if (!state.networks) {
        state.networks = [];
      }
      state.networks.push(network);
    } else {
      if (JSON.stringify(storedNetwork) === JSON.stringify(network)) {
        console.log(
          `upsertNetwork: same network and hence skip calling snap state update: ${JSON.stringify(storedNetwork)}`,
        );
        return;
      }
      storedNetwork.name = network.name;
      storedNetwork.baseUrl = network.baseUrl;
      storedNetwork.nodeUrl = network.nodeUrl;
      storedNetwork.voyagerUrl = network.voyagerUrl;
      storedNetwork.accountClassHash = network.accountClassHash;
      storedNetwork.useOldAccounts = !!network.useOldAccounts;
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

export function getErc20Token(state: SnapState, tokenAddress: string, chainId: string) {
  return state.erc20Tokens?.find(
    (token) => number.toBN(token.address).eq(number.toBN(tokenAddress)) && Number(token.chainId) === Number(chainId),
  );
}

export function getErc20Tokens(state: SnapState, chainId: string) {
  return state.erc20Tokens?.filter((token) => Number(token.chainId) === Number(chainId));
}

export function getEtherErc20Token(state: SnapState, chainId: string) {
  return state.erc20Tokens?.find((token) => Number(token.chainId) === Number(chainId) && token.symbol === 'ETH');
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
      if (JSON.stringify(storedErc20Token) === JSON.stringify(erc20Token)) {
        console.log(
          `upsertErc20Token: same Erc20 token and hence skip calling snap state update: ${JSON.stringify(
            storedErc20Token,
          )}`,
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

export function getNetworkFromChainId(state: SnapState, targerChainId: string | undefined, useOldAccounts = false) {
  const chainId = targerChainId || STARKNET_TESTNET_NETWORK.chainId;
  const network = getNetwork(state, chainId, useOldAccounts);
  if (!network) {
    throw new Error(`can't find the network in snap state with chainId: ${chainId}`);
  }
  console.log(`getNetworkFromChainId: From ${targerChainId}:\n${JSON.stringify(network)}`);
  return network;
}

export function getChainIdHex(network: Network) {
  return `0x${Number(network.chainId).toString(16)}`;
}

export function getTransactionFromVoyagerUrl(network: Network) {
  return `${network.voyagerUrl}${VOYAGER_API_TXN_URL_SUFFIX}`;
}

export function getTransactionsFromVoyagerUrl(network: Network) {
  return `${network.voyagerUrl}${VOYAGER_API_TXNS_URL_SUFFIX}`;
}

export function getTransaction(state: SnapState, txnHash: string, chainId: string) {
  return state.transactions?.find(
    (txn) => number.toBN(txn.txnHash).eq(number.toBN(txnHash)) && Number(txn.chainId) === Number(chainId),
  );
}

export function getTransactions(
  state: SnapState,
  chainId: string,
  senderAddress: string | undefined,
  contractAddress: string | undefined,
  txnType: VoyagerTransactionType | string | string[] | undefined,
  status: string | string[] | undefined,
  minTimestamp: number | undefined, // in ms
): Transaction[] {
  let filteredTxns: Transaction[] = [];

  if (state.transactions) {
    filteredTxns = state.transactions.filter((txn) => Number(txn.chainId) === Number(chainId));
    if (minTimestamp) {
      filteredTxns = filteredTxns.filter((txn) => txn.timestamp * 1000 >= minTimestamp);
    }
    if (senderAddress) {
      filteredTxns = filteredTxns.filter((txn) => number.toBN(txn.senderAddress).eq(number.toBN(senderAddress)));
    }
    if (contractAddress) {
      filteredTxns = filteredTxns.filter((txn) => number.toBN(txn.contractAddress).eq(number.toBN(contractAddress)));
    }
    if (txnType) {
      if (Array.isArray(txnType)) {
        filteredTxns = filteredTxns.filter((txn) => txnType.includes(txn.txnType));
      } else {
        filteredTxns = filteredTxns.filter((txn) => txn.txnType === txnType);
      }
    }
    if (status) {
      if (Array.isArray(status)) {
        filteredTxns = filteredTxns.filter((txn) =>
          status.map((x) => x.toLowerCase()).includes(txn.status.toLowerCase()),
        );
      } else {
        filteredTxns = filteredTxns.filter((txn) => txn.status.toLowerCase() === status.toLowerCase());
      }
    }
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
      if (JSON.stringify(storedTxn) === JSON.stringify(txn)) {
        console.log(
          `upsertTransaction: same transaction and hence skip calling snap state update: ${JSON.stringify(storedTxn)}`,
        );
        return;
      }
      storedTxn.status = txn.status;
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
        (txn.status !== TransactionStatus.ACCEPTED_ON_L2 && txn.status !== TransactionStatus.ACCEPTED_ON_L1) ||
        (txn.status === TransactionStatus.ACCEPTED_ON_L2 && txn.timestamp * 1000 >= minTimeStamp),
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
