import type { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import type {
  TypedData,
  Call,
  DeployContractResponse,
  InvokeFunctionResponse,
  EstimateFee,
  RawCalldata,
  CallContractResponse,
  ProviderOptions,
  GetTransactionResponse,
  Invocations,
  DeclareContractPayload,
  DeclareContractResponse,
  Signature,
  Abi,
  UniversalDetails,
  DeclareSignerDetails,
  DeployAccountSignerDetails,
  CairoVersion,
  InvocationsSignerDetails,
  ProviderInterface,
  GetTransactionReceiptResponse,
} from 'starknet';
import {
  ec,
  json,
  hash,
  num as numUtils,
  typedData,
  constants,
  encode,
  CallData,
  Provider,
  Account,
  validateAndParseAddress as _validateAndParseAddress,
  Signer,
  stark,
} from 'starknet';

import type { RpcV4GetTransactionReceiptResponse } from '../types/snapApi';
import type { Network, SnapState, Transaction } from '../types/snapState';
import { TransactionType } from '../types/snapState';
import type { TransactionStatuses } from '../types/starknet';
import type { VoyagerTransactions, VoyagerTransactionItem } from '../types/voyager';
import {
  PROXY_CONTRACT_HASH,
  TRANSFER_SELECTOR_HEX,
  UPGRADE_SELECTOR_HEX,
  MIN_ACC_CONTRACT_VERSION,
  ACCOUNT_CLASS_HASH_LEGACY,
  ACCOUNT_CLASS_HASH,
  CAIRO_VERSION,
  CAIRO_VERSION_LEGACY,
} from './constants';
import { hexToString } from './formatterUtils';
import { getAddressKey } from './keyPair';
import { logger } from './logger';
import { toJson } from './serializer';
import { getAccount, getAccounts, getRPCUrl, getTransactionsFromVoyagerUrl, getVoyagerCredentials } from './snapUtils';

export const getData = async (url = '', headers: Record<string, string> = {}) => {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
    redirect: 'follow', // manual, *follow, error
    headers,
  });
  return response.json(); // parses JSON response into native JavaScript objects
};

export const postData = async (url = '', data = {}) => {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    // mode: 'cors', // no-cors, *cors, same-origin
    // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    // credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'follow', // manual, *follow, error
    // referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: json.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
};

export const getCallDataArray = (callDataStr: string): string[] => {
  return (callDataStr ?? '')
    .split(',')
    .map((data) => data.trim())
    .filter((data) => data.length > 0);
};

export const getProvider = (network: Network): ProviderInterface => {
  let providerParam: ProviderOptions = {};
  providerParam = {
    nodeUrl: getRPCUrl(network.chainId),
  };
  return new Provider(providerParam);
};

export const getAccountInstance = (
  network: Network,
  userAddress: string,
  privateKey: string | Uint8Array,
  cairoVersion?: CairoVersion,
): Account => {
  const provider = getProvider(network);
  return new Account(provider, userAddress, privateKey, cairoVersion ?? CAIRO_VERSION);
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

export const waitForTransaction = async (
  network: Network,
  senderAddress: string,
  privateKey: string | Uint8Array,
  txnHash: numUtils.BigNumberish,
  cairoVersion?: CairoVersion,
): Promise<GetTransactionReceiptResponse> => {
  return getAccountInstance(network, senderAddress, privateKey, cairoVersion).waitForTransaction(txnHash);
};

export const declareContract = async (
  network: Network,
  senderAddress: string,
  privateKey: string | Uint8Array,
  contractPayload: DeclareContractPayload,
  invocationsDetails?: UniversalDetails,
  cairoVersion?: CairoVersion,
): Promise<DeclareContractResponse> => {
  return getAccountInstance(network, senderAddress, privateKey, cairoVersion).declare(contractPayload, {
    ...invocationsDetails,
    skipValidate: false,
    blockIdentifier: 'latest',
  });
};

export const estimateFee = async (
  network: Network,
  senderAddress: string,
  privateKey: string | Uint8Array,
  txnInvocation: Call | Call[],
  cairoVersion?: CairoVersion,
  invocationsDetails?: UniversalDetails,
): Promise<EstimateFee> => {
  return getAccountInstance(network, senderAddress, privateKey, cairoVersion).estimateInvokeFee(txnInvocation, {
    ...invocationsDetails,
    skipValidate: false,
    blockIdentifier: 'latest',
  });
};

export const estimateFeeBulk = async (
  network: Network,
  senderAddress: string,
  privateKey: string | Uint8Array,
  txnInvocation: Invocations,
  invocationsDetails?: UniversalDetails,
  cairoVersion?: CairoVersion,
): Promise<EstimateFee[]> => {
  return getAccountInstance(network, senderAddress, privateKey, cairoVersion).estimateFeeBulk(txnInvocation, {
    ...invocationsDetails,
    skipValidate: false,
    blockIdentifier: 'latest',
  });
};

export const executeTxn = async (
  network: Network,
  senderAddress: string,
  privateKey: string | Uint8Array,
  txnInvocation: Call | Call[],
  abis?: Abi[],
  invocationsDetails?: UniversalDetails,
  cairoVersion?: CairoVersion,
): Promise<InvokeFunctionResponse> => {
  return getAccountInstance(network, senderAddress, privateKey, cairoVersion).execute(txnInvocation, abis, {
    ...invocationsDetails,
    skipValidate: false,
    blockIdentifier: 'latest',
  });
};

export const deployAccount = async (
  network: Network,
  contractAddress: string,
  contractCallData: RawCalldata,
  addressSalt: numUtils.BigNumberish,
  privateKey: string | Uint8Array,
  cairoVersion?: CairoVersion,
  invocationsDetails?: UniversalDetails,
): Promise<DeployContractResponse> => {
  const deployAccountPayload = {
    classHash: ACCOUNT_CLASS_HASH,
    contractAddress,
    constructorCalldata: contractCallData,
    addressSalt,
  };
  return getAccountInstance(network, contractAddress, privateKey, cairoVersion).deployAccount(deployAccountPayload, {
    ...invocationsDetails,
    skipValidate: false,
    blockIdentifier: 'latest',
  });
};

export const estimateAccountDeployFee = async (
  network: Network,
  contractAddress: string,
  contractCallData: RawCalldata,
  addressSalt: numUtils.BigNumberish,
  privateKey: string | Uint8Array,
  cairoVersion?: CairoVersion,
  invocationsDetails?: UniversalDetails,
): Promise<EstimateFee> => {
  const deployAccountPayload = {
    classHash: ACCOUNT_CLASS_HASH,
    contractAddress,
    constructorCalldata: contractCallData,
    addressSalt,
  };
  return getAccountInstance(network, contractAddress, privateKey, cairoVersion).estimateAccountDeployFee(
    deployAccountPayload,
    {
      ...invocationsDetails,
      skipValidate: false,
      blockIdentifier: 'latest',
    },
  );
};

export const getSigner = async (userAccAddress: string, network: Network): Promise<string> => {
  const resp = await callContract(network, userAccAddress, 'getSigner');
  return resp[0];
};

export const getVersion = async (userAccAddress: string, network: Network): Promise<string> => {
  const resp = await callContract(network, userAccAddress, 'getVersion');
  return resp[0];
};

export const getOwner = async (userAccAddress: string, network: Network): Promise<string> => {
  const resp = await callContract(network, userAccAddress, 'get_owner');
  return resp[0];
};

export const getContractOwner = async (
  userAccAddress: string,
  network: Network,
  version: CairoVersion,
): Promise<string> => {
  return version === '0' ? getSigner(userAccAddress, network) : getOwner(userAccAddress, network);
};

export const getBalance = async (address: string, tokenAddress: string, network: Network) => {
  const resp = await callContract(network, tokenAddress, 'balanceOf', [numUtils.toBigInt(address).toString(10)]);
  return resp[0];
};

export const getTransactionStatus = async (transactionHash: numUtils.BigNumberish, network: Network) => {
  const provider = getProvider(network);
  const receipt = (await provider.getTransactionReceipt(transactionHash)) as RpcV4GetTransactionReceiptResponse;
  return {
    executionStatus: receipt.execution_status,
    finalityStatus: receipt.finality_status,
  };
};

export const getTransaction = async (transactionHash: numUtils.BigNumberish, network: Network) => {
  const provider = getProvider(network);
  return provider.getTransaction(transactionHash);
};

export const getTransactionsFromVoyager = async (
  toAddress: numUtils.BigNumberish,
  pageSize: number,
  pageNum: number,
  network: Network,
) => {
  let toQueryStr = '';
  if (toAddress) {
    toQueryStr = `to=${numUtils.toHex(numUtils.toBigInt(toAddress))}&`;
  }
  // "ps" only effective on value: 10, 25, 50 as what's currently available in Voyager page
  return getData(
    `${getTransactionsFromVoyagerUrl(network)}?${toQueryStr}ps=${pageSize}&p=${pageNum}`,
    getVoyagerCredentials(),
  ) as unknown as VoyagerTransactions;
};

const getTransactionsFromVoyagerHelper = async (
  toAddress: numUtils.BigNumberish,
  pageSize: number,
  minTimestamp: number, // in ms
  withDeployTxn: boolean,
  network: Network,
) => {
  let txns: VoyagerTransactionItem[] = [];
  let i = 1;
  let maxPage = i;
  do {
    try {
      const { items, lastPage } = await getTransactionsFromVoyager(toAddress, pageSize, i, network);
      txns.push(...items);
      maxPage = lastPage;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.error(`getTransactionsFromVoyagerHelper: error received from getTransactionsFromVoyager: ${error}`);
    }
    i += 1;
  } while (i <= maxPage && txns[txns.length - 1]?.timestamp * 1000 >= minTimestamp);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  logger.log(
    `getTransactionsFromVoyagerHelper: minTimestamp = ${minTimestamp}, i = ${i}, maxPage = ${maxPage}, total = ${txns.length}`,
  );

  let deployTxns: VoyagerTransactionItem[] = [];
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
      } catch (error) {
        logger.error(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `getTransactionsFromVoyagerHelper: error received from getTransactionsFromVoyager at last page: ${error}`,
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
  toAddress: numUtils.BigNumberish,
  contractAddress: numUtils.BigNumberish | undefined,
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

  const bigIntTransferSelectorHex = numUtils.toBigInt(TRANSFER_SELECTOR_HEX);
  const bigIntUpgradeSelectorHex = numUtils.toBigInt(UPGRADE_SELECTOR_HEX);
  let massagedTxns = await Promise.all(
    txns.map(async (txn) => {
      logger.log(`getMassagedTransactions: txn:\n${toJson(txn)}`);

      let txnResp: GetTransactionResponse | undefined;
      let statusResp: TransactionStatuses | undefined;
      try {
        txnResp = await getTransaction(txn.hash, network);
        statusResp = (await getTransactionStatus(txn.hash, network)) as unknown as TransactionStatuses;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        logger.log(`getMassagedTransactions: txnResp:\n${toJson(txnResp)}`);
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        logger.log(`getMassagedTransactions: statusResp:\n${toJson(statusResp)}`);
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        logger.error(`getMassagedTransactions: error received from getTransaction: ${error}`);
      }

      /* eslint-disable */
      const massagedTxn: Transaction = {
        txnHash: txnResp ? txnResp.transaction_hash : txn.hash,
        txnType: txn.type?.toLowerCase(),
        chainId: network.chainId,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        senderAddress: txnResp.sender_address ?? txnResp.contract_address ?? txn.contract_address ?? '',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        contractAddress: txnResp.calldata?.[1] ?? txnResp.contract_address ?? txn.contract_address ?? '',

        contractFuncName:
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          numUtils.toBigInt(txnResp.calldata?.[2] ?? '') === bigIntTransferSelectorHex
            ? 'transfer'
            : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            numUtils.toBigInt(txnResp.calldata?.[2] ?? '') === bigIntUpgradeSelectorHex
            ? 'upgrade'
            : '',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        contractCallData: txnResp.calldata ?? [],
        timestamp: txn.timestamp,
        status: '', // DEPRECATION
        finalityStatus: statusResp ? statusResp.finalityStatus ?? '' : '',
        executionStatus: statusResp ? statusResp.executionStatus : '',
        eventIds: [],
        failureReason: '',
      };
      /* eslint-disable */

      return massagedTxn;
    }),
  );
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  logger.log(`getMassagedTransactions: massagedTxns total = ${massagedTxns.length}`);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  logger.log(`getMassagedTransactions: massagedTxns:\n${toJson(massagedTxns)}`);

  if (contractAddress) {
    const bigIntContractAddress = numUtils.toBigInt(contractAddress);
    massagedTxns = massagedTxns.filter(
      (massagedTxn) =>
        numUtils.toBigInt(massagedTxn.contractAddress) === bigIntContractAddress ||
        massagedTxn.contractFuncName === 'upgrade' ||
        deployTxns.find((deployTxn) => deployTxn.hash === massagedTxn.txnHash),
    );
  }

  return massagedTxns;
};

/**
 *
 * @param privateKey
 */
export function getFullPublicKeyPairFromPrivateKey(privateKey: string) {
  return encode.addHexPrefix(encode.buf2hex(ec.starkCurve.getPublicKey(privateKey, false)));
}

export const getTypedDataMessageSignature = (
  privateKey: string,
  typedDataMessage: TypedData,
  signerUserAddress: string,
) => {
  const msgHash = typedData.getMessageHash(typedDataMessage, signerUserAddress);
  return ec.starkCurve.sign(msgHash, privateKey);
};

export const getSignatureBySignatureString = (signatureStr: string) => {
  return ec.starkCurve.Signature.fromDER(signatureStr);
};

export const verifyTypedDataMessageSignature = (
  fullPublicKey: string,
  typedDataMessage: TypedData,
  signerUserAddress: numUtils.BigNumberish,
  signatureStr: string,
) => {
  const signature = getSignatureBySignatureString(signatureStr);
  const msgHash = typedData.getMessageHash(typedDataMessage, signerUserAddress);
  return ec.starkCurve.verify(signature, msgHash, fullPublicKey);
};

export const getNextAddressIndex = (chainId: string, state: SnapState, derivationPath: string) => {
  const accounts = getAccounts(state, chainId).filter(
    (acc) => acc.derivationPath === derivationPath && acc.addressIndex >= 0,
  );
  const uninitializedAccount = accounts.find(
    (acc) => !acc.publicKey || numUtils.toBigInt(acc.publicKey) === constants.ZERO,
  );
  logger.log(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `getNextAddressIndex:\nUninitialized account found from state:\n${toJson(uninitializedAccount ?? 'None')}`,
  );
  return uninitializedAccount?.addressIndex ?? accounts.length;
};

/**
 * calculate contract address by publicKey
 *
 * @param publicKey - address's publicKey.
 * @returns address and calldata.
 */
export const getAccContractAddressAndCallData = (publicKey) => {
  const callData = CallData.compile({
    signer: publicKey,
    guardian: '0',
  });

  let address = hash.calculateContractAddressFromHash(publicKey, ACCOUNT_CLASS_HASH, callData, 0);

  if (address.length < 66) {
    address = address.replace('0x', `0x${'0'.repeat(66 - address.length)}`);
  }
  return {
    address,
    callData,
  };
};

/**
 * calculate contract address by publicKey
 *
 * @param publicKey - address's publicKey.
 * @returns address and calldata.
 */
export const getAccContractAddressAndCallDataLegacy = (publicKey) => {
  const callData = CallData.compile({
    implementation: ACCOUNT_CLASS_HASH_LEGACY,
    selector: hash.getSelectorFromName('initialize'),
    calldata: CallData.compile({ signer: publicKey, guardian: '0' }),
  });
  let address = hash.calculateContractAddressFromHash(publicKey, PROXY_CONTRACT_HASH, callData, 0);
  if (address.length < 66) {
    address = address.replace('0x', `0x${'0'.repeat(66 - address.length)}`);
  }
  return {
    address,
    callData,
  };
};

/**
 * Get address permutation by public key
 *
 * @param pk - Public key.
 * @returns address and addressLegacy.
 */
export const getPermutationAddresses = (pk: string) => {
  const { address } = getAccContractAddressAndCallData(pk);
  const { address: addressLegacy } = getAccContractAddressAndCallDataLegacy(pk);

  return {
    address,
    addressLegacy,
  };
};

export const getKeysFromAddressIndex = async (
  keyDeriver: BIP44AddressKeyDeriver,
  chainId: string,
  state: SnapState,
  index?: number,
) => {
  let addressIndex = index;
  if (addressIndex === undefined || isNaN(addressIndex) || addressIndex < 0) {
    addressIndex = getNextAddressIndex(chainId, state, keyDeriver.path);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.log(`getKeysFromAddressIndex: addressIndex found: ${addressIndex}`);
  }

  const { addressKey, derivationPath } = await getAddressKey(keyDeriver, addressIndex);
  const starkKeyPub = ec.starkCurve.getStarkKey(addressKey);
  const starkKeyPrivate = numUtils.toHex(addressKey);
  return {
    privateKey: starkKeyPrivate,
    publicKey: starkKeyPub,
    addressIndex,
    derivationPath,
  };
};

/**
 * Find address index from the keyDeriver
 *
 * @param chainId - Network ChainId.
 * @param address - Input address.
 * @param keyDeriver - keyDeriver from MetaMask wallet.
 * @param state - MetaMask Snap state.
 * @param maxScan - Number of scaning in the keyDeriver.
 * @returns address index and cairoVersion.
 */
export const findAddressIndex = async (
  chainId: string,
  address: string,
  keyDeriver,
  state: SnapState,
  maxScan = 20,
) => {
  const bigIntAddress = numUtils.toBigInt(address);
  for (let i = 0; i < maxScan; i++) {
    const { publicKey } = await getKeysFromAddressIndex(keyDeriver, chainId, state, i);
    const { address: calculatedAddress, addressLegacy: calculatedAddressLegacy } = getPermutationAddresses(publicKey);

    if (
      numUtils.toBigInt(calculatedAddress) === bigIntAddress ||
      numUtils.toBigInt(calculatedAddressLegacy) === bigIntAddress
    ) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.log(`findAddressIndex:\nFound address in scan: ${i} ${address}`);
      return {
        index: i,
        cairoVersion: numUtils.toBigInt(calculatedAddress) === bigIntAddress ? 1 : 0,
      };
    }
  }
  throw new Error(`Address not found: ${address}`);
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
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.log(`getNextAddressIndex:\nFound address in state: ${addressIndex} ${address}`);
  } else {
    const result = await findAddressIndex(network.chainId, address, keyDeriver, state, maxScan);
    addressIndex = result.index;
  }
  return getKeysFromAddressIndex(keyDeriver, network.chainId, state, addressIndex);
};

/**
 * Check address is deployed by using getVersion
 *
 * @param network - Network.
 * @param address - Input address.
 * @returns boolean.
 */
export const isAccountDeployed = async (network: Network, address: string) => {
  try {
    await getVersion(address, network);
    return true;
  } catch (error) {
    if (!error.message.includes('Contract not found')) {
      throw error;
    }
    return false;
  }
};

export const addFeesFromAllTransactions = (fees: EstimateFee[]): Partial<EstimateFee> => {
  let overallFee = numUtils.toBigInt(0);
  let suggestedMaxFee = numUtils.toBigInt(0);

  fees.forEach((fee) => {
    overallFee += fee.overall_fee;
    suggestedMaxFee += fee.suggestedMaxFee;
  });

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    overall_fee: overallFee,
    suggestedMaxFee,
  };
};

export const _validateAndParseAddressFn = _validateAndParseAddress;
export const validateAndParseAddress = (address: numUtils.BigNumberish, length = 63) => {
  // getting rid of 0x and 0x0 prefixes
  const trimmedAddress = address.toString().replace(/^0x0?/u, '');
  if (trimmedAddress.length !== length) {
    throw new Error(`Address ${address} has an invalid length`);
  }
  return _validateAndParseAddressFn(address);
};

/**
 * Compare version number with MIN_ACC_CONTRACT_VERSION
 *
 * @param version - version, e.g (2.3.0).
 * @returns boolean.
 */
export const isGTEMinVersion = (version: string) => {
  logger.log(`isGTEMinVersion: version = ${version}`);
  const versionArr = version.split('.');
  return Number(versionArr[1]) >= MIN_ACC_CONTRACT_VERSION[1];
};

/**
 * Check address needed upgrade by using getVersion and compare with MIN_ACC_CONTRACT_VERSION
 *
 * @param network - Network.
 * @param address - Input address.
 * @returns boolean.
 */
export const isUpgradeRequired = async (network: Network, address: string) => {
  try {
    logger.log(`isUpgradeRequired: address = ${address}`);
    const hexResp = await getVersion(address, network);
    return !isGTEMinVersion(hexToString(hexResp));
  } catch (error) {
    if (!error.message.includes('Contract not found')) {
      throw error;
    }
    // [TODO] if address is cairo0 but not deployed we throw error
    return false;
  }
};

/**
 * Get user address by public key, return address if the address has deployed
 *
 * @param network - Network.
 * @param publicKey - address's public key.
 * @returns address and address's public key.
 */
export const getCorrectContractAddress = async (network: Network, publicKey: string) => {
  const { address: contractAddress, addressLegacy: contractAddressLegacy } = getPermutationAddresses(publicKey);

  logger.log(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `getContractAddressByKey: contractAddress = ${contractAddress}\ncontractAddressLegacy = ${contractAddressLegacy}\npublicKey = ${publicKey}`,
  );

  let address = contractAddress;
  let upgradeRequired = false;
  let pk = '';

  try {
    await getVersion(contractAddress, network);
    pk = await getContractOwner(address, network, CAIRO_VERSION);
  } catch (error4LatestContract) {
    if (!error4LatestContract.message.includes('Contract not found')) {
      throw error4LatestContract;
    }

    logger.log(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `getContractAddressByKey: cairo ${CAIRO_VERSION} contract cant found, try cairo ${CAIRO_VERSION_LEGACY}`,
    );

    try {
      const version = await getVersion(contractAddressLegacy, network);
      upgradeRequired = !isGTEMinVersion(hexToString(version));
      pk = await getContractOwner(
        contractAddressLegacy,
        network,
        upgradeRequired ? CAIRO_VERSION_LEGACY : CAIRO_VERSION,
      );
      address = contractAddressLegacy;
    } catch (error4LegacyContract) {
      if (!error4LegacyContract.message.includes('Contract not found')) {
        throw error4LegacyContract;
      }

      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.log(`getContractAddressByKey: no deployed contract found, fallback to cairo ${CAIRO_VERSION}`);
    }
  }

  return {
    address,
    signerPubKey: pk,
    upgradeRequired,
  };
};

export const signTransactions = async (
  privateKey: string,
  transactions: Call[],
  transactionsDetail: InvocationsSignerDetails,
): Promise<Signature> => {
  const signer = new Signer(privateKey);
  const signatures = await signer.signTransaction(transactions, transactionsDetail);
  return stark.signatureToDecimalArray(signatures);
};

export const signDeployAccountTransaction = async (
  privateKey: string,
  transaction: DeployAccountSignerDetails,
): Promise<Signature> => {
  const signer = new Signer(privateKey);
  const signatures = await signer.signDeployAccountTransaction(transaction);
  return stark.signatureToDecimalArray(signatures);
};

export const signMessage = async (privateKey: string, typedDataMessage: TypedData, signerUserAddress: string) => {
  const signer = new Signer(privateKey);
  const signatures = await signer.signMessage(typedDataMessage, signerUserAddress);
  return stark.signatureToDecimalArray(signatures);
};

export const signDeclareTransaction = async (
  privateKey: string,
  transaction: DeclareSignerDetails,
): Promise<Signature> => {
  const signer = new Signer(privateKey);
  const signatures = await signer.signDeclareTransaction(transaction);
  return stark.signatureToDecimalArray(signatures);
};

export const getStarkNameUtil = async (network: Network, userAddress: string) => {
  const provider = getProvider(network);
  return Account.getStarkName(provider, userAddress);
};
