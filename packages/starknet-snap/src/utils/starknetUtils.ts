import { toJson } from './serializer';
import { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import {
  ec,
  json,
  hash,
  num,
  typedData,
  constants,
  encode,
  CallData,
  Provider,
  Account,
  Call,
  DeployContractResponse,
  InvokeFunctionResponse,
  EstimateFee,
  RawCalldata,
  CallContractResponse,
  ProviderOptions,
  GetTransactionResponse,
  Invocations,
  validateAndParseAddress as _validateAndParseAddress,
} from 'starknet';
import type { Hex } from '@noble/curves/abstract/utils';
import { Network, SnapState, Transaction, TransactionType } from '../types/snapState';
import { PROXY_CONTRACT_HASH, TRANSFER_SELECTOR_HEX } from './constants';
import { getAddressKey } from './keyPair';
import { getAccount, getAccounts, getTransactionFromVoyagerUrl, getTransactionsFromVoyagerUrl } from './snapUtils';
import { logger } from './logger';

export const getCallDataArray = (callDataStr: string): string[] => {
  return (callDataStr ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
};

export const getProvider = (network: Network, forceSequencer = false): Provider => {
  let providerParam: ProviderOptions = {};
  // same precedence as defined in starknet.js Provider class constructor
  if (network.nodeUrl && !forceSequencer) {
    providerParam = {
      rpc: {
        nodeUrl: network.nodeUrl,
      },
    };
  } else if (network.baseUrl) {
    providerParam = {
      sequencer: {
        baseUrl: network.baseUrl,
      },
    };
  }
  return new Provider(providerParam);
};

export const callContract = async (
  network: Network,
  contractAddress: string,
  contractFuncName: string,
  contractCallData: RawCalldata = [],
): Promise<CallContractResponse> => {
  const provider = getProvider(network);
  return provider.callContract(
    {
      contractAddress,
      entrypoint: contractFuncName,
      calldata: contractCallData,
    },
    'latest',
  );
};

export const estimateFee = async (
  network: Network,
  senderAddress: string,
  privateKey: string | Uint8Array,
  txnInvocation: Call | Call[],
): Promise<EstimateFee> => {
  const provider = getProvider(network);
  const account = new Account(provider, senderAddress, privateKey);
  return account.estimateInvokeFee(txnInvocation, { blockIdentifier: 'latest' });
};

export const estimateFeeBulk = async (
  network: Network,
  senderAddress: string,
  privateKey: string | Uint8Array,
  txnInvocation: Invocations,
): Promise<EstimateFee[]> => {
  // ensure always calling the sequencer endpoint since the rpc endpoint and
  // starknet.js are not supported yet.
  const provider = getProvider(network, true);
  const account = new Account(provider, senderAddress, privateKey);
  return account.estimateFeeBulk(txnInvocation, { blockIdentifier: 'latest' });
};

export const executeTxn = async (
  network: Network,
  senderAddress: string,
  privateKey: string | Uint8Array,
  txnInvocation: Call | Call[],
  maxFee: num.BigNumberish,
  nonce?: number,
): Promise<InvokeFunctionResponse> => {
  const provider = getProvider(network);
  const account = new Account(provider, senderAddress, privateKey);
  return account.execute(txnInvocation, undefined, { nonce, maxFee });
};

export const deployAccount = async (
  network: Network,
  contractAddress: string,
  contractCallData: RawCalldata,
  addressSalt: num.BigNumberish,
  privateKey: string | Uint8Array,
  maxFee: num.BigNumberish,
): Promise<DeployContractResponse> => {
  const provider = getProvider(network);
  const account = new Account(provider, contractAddress, privateKey);
  const deployAccountPayload = {
    classHash: PROXY_CONTRACT_HASH,
    contractAddress: contractAddress,
    constructorCalldata: contractCallData,
    addressSalt,
  };
  return account.deployAccount(deployAccountPayload, { maxFee });
};

export const estimateAccountDeployFee = async (
  network: Network,
  contractAddress: string,
  contractCallData: RawCalldata,
  addressSalt: num.BigNumberish,
  privateKey: string | Uint8Array,
): Promise<EstimateFee> => {
  const provider = getProvider(network);
  const account = new Account(provider, contractAddress, privateKey);
  const deployAccountPayload = {
    classHash: PROXY_CONTRACT_HASH,
    contractAddress: contractAddress,
    constructorCalldata: contractCallData,
    addressSalt,
  };
  return account.estimateAccountDeployFee(deployAccountPayload);
};

export const getSigner = async (userAccAddress: string, network: Network): Promise<string> => {
  const resp = await callContract(network, userAccAddress, 'getSigner');
  return resp.result[0];
};

export const getTransactionStatus = async (transactionHash: num.BigNumberish, network: Network) => {
  // ensure always calling the sequencer endpoint since the rpc endpoint and
  // does not support retrieving status of failed txn yet.
  const provider = getProvider(network, true);
  return (await provider.getTransactionReceipt(transactionHash)).status;
};

export const getTransaction = async (transactionHash: num.BigNumberish, network: Network) => {
  const provider = getProvider(network);
  return provider.getTransaction(transactionHash);
};

export const getTransactionsFromVoyager = async (
  toAddress: num.BigNumberish,
  pageSize: number,
  pageNum: number,
  network: Network,
) => {
  let toQueryStr = '';
  if (toAddress) {
    toQueryStr = `to=${num.toHex(num.toBigInt(toAddress))}&`;
  }

  // "ps" only effective on value: 10, 25, 50 as what's currently available in Voyager page
  return getData(`${getTransactionsFromVoyagerUrl(network)}?${toQueryStr}ps=${pageSize}&p=${pageNum}`);
};

export const getTransactionFromVoyager = async (transactionHash: num.BigNumberish, network: Network) => {
  const txHashHex = num.toHex(num.toBigInt(transactionHash));
  return getData(`${getTransactionFromVoyagerUrl(network)}/${txHashHex}`);
};

const getTransactionsFromVoyagerHelper = async (
  toAddress: num.BigNumberish,
  pageSize: number,
  minTimestamp: number, // in ms
  withDeployTxn: boolean,
  network: Network,
) => {
  let txns = [];
  let i = 1;
  let maxPage = i;
  do {
    try {
      const { items, lastPage } = await getTransactionsFromVoyager(toAddress, pageSize, i, network);
      txns.push(...items);
      maxPage = lastPage;
    } catch (err) {
      logger.error(`getTransactionsFromVoyagerHelper: error received from getTransactionsFromVoyager: ${err}`);
    }
    i++;
  } while (i <= maxPage && txns[txns.length - 1]?.timestamp * 1000 >= minTimestamp);
  logger.log(
    `getTransactionsFromVoyagerHelper: minTimestamp = ${minTimestamp}, i = ${i}, maxPage = ${maxPage}, total = ${txns.length}`,
  );

  let deployTxns = [];
  if (withDeployTxn) {
    if (i <= maxPage) {
      // means lastPage not fetched
      try {
        const { items: lastPageTxns } = await getTransactionsFromVoyager(toAddress, pageSize, maxPage, network);
        deployTxns = lastPageTxns.filter(
          (txn) =>
            txn.type.toLowerCase() === TransactionType.DEPLOY.toLowerCase() ||
            txn.type.toLowerCase() === TransactionType.DEPLOY_ACCOUNT.toLowerCase(),
        );
        txns = [...txns, ...deployTxns];
      } catch (err) {
        logger.error(
          `getTransactionsFromVoyagerHelper: error received from getTransactionsFromVoyager at last page: ${err}`,
        );
      }
    } else {
      deployTxns = txns.filter(
        (txn) =>
          txn.type.toLowerCase() === TransactionType.DEPLOY.toLowerCase() ||
          txn.type.toLowerCase() === TransactionType.DEPLOY_ACCOUNT.toLowerCase(),
      );
    }
  }

  // ensure the txns comes after or at the min timestamp or its in the deploy txns
  txns = txns.filter(
    (txn) => txn.timestamp * 1000 >= minTimestamp || deployTxns.find((deployTxn) => deployTxn.hash === txn.hash),
  );

  return {
    txns,
    deployTxns,
  };
};

export const getMassagedTransactions = async (
  toAddress: num.BigNumberish,
  contractAddress: num.BigNumberish,
  pageSize: number,
  minTimestamp: number, // in ms
  withDeployTxn: boolean,
  network: Network,
): Promise<Transaction[]> => {
  const { txns, deployTxns } = await getTransactionsFromVoyagerHelper(
    toAddress,
    pageSize,
    minTimestamp,
    withDeployTxn,
    network,
  );

  const bigIntTransferSelectorHex = num.toBigInt(TRANSFER_SELECTOR_HEX);
  let massagedTxns = await Promise.all(
    txns.map(async (txn) => {
      let txnResp: GetTransactionResponse;
      try {
        txnResp = await getTransaction(txn.hash, network);
        logger.log(`getMassagedTransactions: txnResp:\n${toJson(txnResp)}`);
      } catch (err) {
        logger.error(`getMassagedTransactions: error received from getTransaction: ${err}`);
      }

      const massagedTxn: Transaction = {
        txnHash: txnResp.transaction_hash || txn.hash,
        txnType: txn.type?.toLowerCase(),
        chainId: network.chainId,
        senderAddress: txnResp.sender_address || txnResp.contract_address || txn.contract_address || '',
        contractAddress: txnResp.calldata?.[1] || txnResp.contract_address || txn.contract_address || '',
        contractFuncName: num.toBigInt(txnResp.calldata?.[2] || '') === bigIntTransferSelectorHex ? 'transfer' : '',
        contractCallData: txnResp.calldata?.slice(6, txnResp.calldata?.length - 1) || [],
        timestamp: txn.timestamp,
        status: txnResp['status'] || txn.status || '',
        eventIds: [],
        failureReason: '',
      };

      return massagedTxn;
    }),
  );

  logger.log(`getMassagedTransactions: massagedTxns total = ${massagedTxns.length}`);
  logger.log(`getMassagedTransactions: massagedTxns:\n${toJson(massagedTxns)}`);

  if (contractAddress) {
    const bigIntContractAddress = num.toBigInt(contractAddress);
    massagedTxns = massagedTxns.filter(
      (massagedTxn) =>
        num.toBigInt(massagedTxn.contractAddress) === bigIntContractAddress ||
        deployTxns.find((deployTxn) => deployTxn.hash === massagedTxn.txnHash),
    );
  }

  return massagedTxns;
};

export const getData = async (url = '') => {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
    redirect: 'follow', // manual, *follow, error
  });
  return response.json(); // parses JSON response into native JavaScript objects
};

export const postData = async (url = '', data = {}) => {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    //mode: 'cors', // no-cors, *cors, same-origin
    //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    //credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'follow', // manual, *follow, error
    //referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: json.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
};

export function getFullPublicKeyPairFromPrivateKey(privateKey: Hex) {
  return encode.addHexPrefix(encode.buf2hex(ec.starkCurve.getPublicKey(privateKey, false)));
}

export const getTypedDataMessageSignature = (
  privateKey: Hex,
  typedDataMessage: typedData.TypedData,
  signerUserAddress: string,
) => {
  const msgHash = typedData.getMessageHash(typedDataMessage, signerUserAddress);
  return ec.starkCurve.sign(msgHash, privateKey);
};

export const getSignatureBySignatureString = (signatureStr: Hex) => {
  return ec.starkCurve.Signature.fromDER(signatureStr);
};

export const verifyTypedDataMessageSignature = (
  fullPublicKey: Hex,
  typedDataMessage: typedData.TypedData,
  signerUserAddress: num.BigNumberish,
  signatureStr: Hex,
) => {
  const signature = getSignatureBySignatureString(signatureStr);
  const msgHash = typedData.getMessageHash(typedDataMessage, signerUserAddress);
  return ec.starkCurve.verify(signature, msgHash, fullPublicKey);
};

export const getNextAddressIndex = (chainId: string, state: SnapState, derivationPath: string) => {
  const accounts = getAccounts(state, chainId).filter(
    (acc) => acc.derivationPath === derivationPath && acc.addressIndex >= 0,
  );
  const uninitializedAccount = accounts.find((acc) => !acc.publicKey || num.toBigInt(acc.publicKey) === constants.ZERO);
  logger.log(
    `getNextAddressIndex:\nUninitialized account found from state:\n${toJson(uninitializedAccount ?? 'None')}`,
  );
  return uninitializedAccount?.addressIndex ?? accounts.length;
};

export const getAccContractAddressAndCallData = (accountClassHash: string, publicKey) => {
  const callData = CallData.compile({
    implementation: accountClassHash,
    selector: hash.getSelectorFromName('initialize'),
    calldata: CallData.compile({ signer: publicKey, guardian: '0' }),
  });
  const address = hash.calculateContractAddressFromHash(publicKey, PROXY_CONTRACT_HASH, callData, 0);
  return {
    address,
    callData,
  };
};

export const getKeysFromAddress = async (
  keyDeriver,
  network: Network,
  state: SnapState,
  address: string,
  maxScan = 20,
) => {
  let addressIndex;
  const acc = getAccount(state, address, network.chainId);
  if (acc) {
    addressIndex = acc.addressIndex;
    logger.log(`getNextAddressIndex:\nFound address in state: ${addressIndex} ${address}`);
  } else {
    const bigIntAddress = num.toBigInt(address);
    for (let i = 0; i < maxScan; i++) {
      const { publicKey } = await getKeysFromAddressIndex(keyDeriver, network.chainId, state, i);
      const { address: calculatedAddress } = getAccContractAddressAndCallData(network.accountClassHash, publicKey);
      if (num.toBigInt(calculatedAddress) === bigIntAddress) {
        addressIndex = i;
        logger.log(`getNextAddressIndex:\nFound address in scan: ${addressIndex} ${address}`);
        break;
      }
    }
  }

  if (!isNaN(addressIndex)) {
    return getKeysFromAddressIndex(keyDeriver, network.chainId, state, addressIndex);
  }
  console.log(`getNextAddressIndex:\nAddress not found: ${address}`);
  throw new Error(`Address not found: ${address}`);
};

export const getKeysFromAddressIndex = async (
  keyDeriver: BIP44AddressKeyDeriver,
  chainId: string,
  state: SnapState,
  index: number = undefined,
) => {
  let addressIndex = index;
  if (isNaN(addressIndex) || addressIndex < 0) {
    addressIndex = getNextAddressIndex(chainId, state, keyDeriver.path);
    logger.log(`getKeysFromAddressIndex: addressIndex found: ${addressIndex}`);
  }

  const { addressKey, derivationPath } = await getAddressKey(keyDeriver, addressIndex);
  const starkKeyPub = ec.starkCurve.getStarkKey(addressKey);
  const starkKeyPrivate = num.toHex(addressKey);
  return {
    privateKey: starkKeyPrivate,
    publicKey: starkKeyPub,
    addressIndex,
    derivationPath,
  };
};

export const isAccountDeployed = async (network: Network, publicKey: string) => {
  let accountDeployed = true;
  try {
    const { address: signerContractAddress } = getAccContractAddressAndCallData(network.accountClassHash, publicKey);
    await getSigner(signerContractAddress, network);
  } catch (err) {
    accountDeployed = false;
  }
  logger.log(`isAccountDeployed: ${accountDeployed}`);
  return accountDeployed;
};

export const addFeesFromAllTransactions = (fees: EstimateFee[]): EstimateFee => {
  let overall_fee_bn = num.toBigInt(0);
  let suggestedMaxFee_bn = num.toBigInt(0);

  fees.forEach((fee) => {
    overall_fee_bn = overall_fee_bn + fee.overall_fee;
    suggestedMaxFee_bn = suggestedMaxFee_bn + fee.suggestedMaxFee;
  });

  return {
    overall_fee: overall_fee_bn,
    suggestedMaxFee: suggestedMaxFee_bn,
  };
};

export const _validateAndParseAddressFn = _validateAndParseAddress;
export const validateAndParseAddress = (address: num.BigNumberish, length = 63) => {
  // getting rid of 0x and 0x0 prefixes
  const trimmedAddress = address.toString().replace(/^0x0?/, '');
  if (trimmedAddress.length !== length) throw new Error(`Address ${address} has an invalid length`);
  return _validateAndParseAddressFn(address);
};
