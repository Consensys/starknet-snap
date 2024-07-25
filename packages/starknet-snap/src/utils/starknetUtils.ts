import { toJson } from './serializer';
import { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import {
  ec,
  json,
  hash,
  num,
  TypedData,
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
  DeclareContractPayload,
  DeclareContractResponse,
  Signer,
  Signature,
  stark,
  Abi,
  UniversalDetails,
  DeclareSignerDetails,
  DeployAccountSignerDetails,
  CairoVersion,
  InvocationsSignerDetails,
  ProviderInterface,
  GetTransactionReceiptResponse,
  BigNumberish,
  BlockIdentifier,
} from 'starknet';
import { Network, SnapState, Transaction, TransactionType } from '../types/snapState';
import {
  PROXY_CONTRACT_HASH,
  TRANSFER_SELECTOR_HEX,
  UPGRADE_SELECTOR_HEX,
  MIN_ACC_CONTRACT_VERSION,
  ACCOUNT_CLASS_HASH_LEGACY,
  ACCOUNT_CLASS_HASH,
  CAIRO_VERSION,
  CAIRO_VERSION_LEGACY,
  ETHER_MAINNET,
  ETHER_SEPOLIA_TESTNET,
} from './constants';
import { getAddressKey } from './keyPair';
import {
  getAccount,
  getAccounts,
  getRPCUrl,
  getTransactionFromVoyagerUrl,
  getTransactionsFromVoyagerUrl,
  getVoyagerCredentials,
} from './snapUtils';
import { logger } from './logger';
import { RpcV4GetTransactionReceiptResponse } from '../types/snapApi';
import { hexToString } from './formatterUtils';
import { DeployRequiredError, UpgradeRequiredError } from './exceptions';

export const getCallDataArray = (callDataStr: string): string[] => {
  return (callDataStr ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
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
  blockIdentifier: BlockIdentifier = 'latest',
): Promise<CallContractResponse> => {
  const provider = getProvider(network);
  return provider.callContract(
    {
      contractAddress,
      entrypoint: contractFuncName,
      calldata: contractCallData,
    },
    blockIdentifier,
  );
};

export const waitForTransaction = async (
  network: Network,
  senderAddress: string,
  privateKey: string | Uint8Array,
  txnHash: num.BigNumberish,
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
  addressSalt: num.BigNumberish,
  privateKey: string | Uint8Array,
  cairoVersion?: CairoVersion,
  invocationsDetails?: UniversalDetails,
): Promise<DeployContractResponse> => {
  const classHash = cairoVersion == CAIRO_VERSION ? ACCOUNT_CLASS_HASH : PROXY_CONTRACT_HASH;
  const deployAccountPayload = {
    classHash: classHash,
    contractAddress: contractAddress,
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
  addressSalt: num.BigNumberish,
  privateKey: string | Uint8Array,
  cairoVersion?: CairoVersion,
  invocationsDetails?: UniversalDetails,
): Promise<EstimateFee> => {
  const classHash = cairoVersion == CAIRO_VERSION ? ACCOUNT_CLASS_HASH : PROXY_CONTRACT_HASH;
  const deployAccountPayload = {
    classHash: classHash,
    contractAddress: contractAddress,
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
  const resp = await callContract(network, tokenAddress, 'balanceOf', [num.toBigInt(address).toString(10)], 'pending');
  return resp[0];
};

export const isEthBalanceEmpty = async (network: Network, address: string, maxFee: bigint = constants.ZERO) => {
  const etherErc20TokenAddress =
    network.chainId === ETHER_SEPOLIA_TESTNET.chainId ? ETHER_SEPOLIA_TESTNET.address : ETHER_MAINNET.address;

  return (
    num.toBigInt((await getBalance(address, etherErc20TokenAddress, network)) ?? num.toBigInt(constants.ZERO)) <= maxFee
  );
};

export const getTransactionStatus = async (transactionHash: num.BigNumberish, network: Network) => {
  const provider = getProvider(network);
  const receipt = (await provider.getTransactionReceipt(transactionHash)) as RpcV4GetTransactionReceiptResponse;
  return {
    executionStatus: receipt.execution_status,
    finalityStatus: receipt.finality_status,
  };
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
  return getData(
    `${getTransactionsFromVoyagerUrl(network)}?${toQueryStr}ps=${pageSize}&p=${pageNum}`,
    getVoyagerCredentials(),
  );
};

export const getTransactionFromVoyager = async (transactionHash: num.BigNumberish, network: Network) => {
  const txHashHex = num.toHex(num.toBigInt(transactionHash));
  return getData(`${getTransactionFromVoyagerUrl(network)}/${txHashHex}`, getVoyagerCredentials());
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
  const bigIntUpgradeSelectorHex = num.toBigInt(UPGRADE_SELECTOR_HEX);
  let massagedTxns = await Promise.all(
    txns.map(async (txn) => {
      logger.log(`getMassagedTransactions: txn:\n${toJson(txn)}`);

      let txnResp: GetTransactionResponse;
      let statusResp;
      try {
        txnResp = await getTransaction(txn.hash, network);
        statusResp = await getTransactionStatus(txn.hash, network);
        logger.log(`getMassagedTransactions: txnResp:\n${toJson(txnResp)}`);
        logger.log(`getMassagedTransactions: statusResp:\n${toJson(statusResp)}`);
      } catch (err) {
        logger.error(`getMassagedTransactions: error received from getTransaction: ${err}`);
      }

      const massagedTxn: Transaction = {
        txnHash: txnResp.transaction_hash || txn.hash,
        txnType: txn.type?.toLowerCase(),
        chainId: network.chainId,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        senderAddress: txnResp.sender_address || txnResp.contract_address || txn.contract_address || '',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        contractAddress: txnResp.calldata?.[1] || txnResp.contract_address || txn.contract_address || '',

        contractFuncName:
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          num.toBigInt(txnResp.calldata?.[2] || '') === bigIntTransferSelectorHex
            ? 'transfer'
            : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            num.toBigInt(txnResp.calldata?.[2] || '') === bigIntUpgradeSelectorHex
            ? 'upgrade'
            : txn.operations ?? '',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        contractCallData: txnResp.calldata || [],
        timestamp: txn.timestamp,
        status: '', //DEPRECATION
        finalityStatus: statusResp.finalityStatus || '',
        executionStatus: statusResp.executionStatus || '',
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
        massagedTxn.contractFuncName === 'upgrade' ||
        deployTxns.find((deployTxn) => deployTxn.hash === massagedTxn.txnHash),
    );
  }

  return massagedTxns;
};

export const getData = async (url = '', headers: Record<string, string> = {}) => {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
    redirect: 'follow', // manual, *follow, error
    headers: headers,
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
  signerUserAddress: num.BigNumberish,
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
  const uninitializedAccount = accounts.find((acc) => !acc.publicKey || num.toBigInt(acc.publicKey) === constants.ZERO);
  logger.log(
    `getNextAddressIndex:\nUninitialized account found from state:\n${toJson(uninitializedAccount ?? 'None')}`,
  );
  return uninitializedAccount?.addressIndex ?? accounts.length;
};

/**
 * calculate contract address by publicKey
 *
 * @param  publicKey - address's publicKey.
 * @returns - address and calldata.
 */
export const getAccContractAddressAndCallData = (publicKey) => {
  const callData = CallData.compile({
    signer: publicKey,
    guardian: '0',
  });

  let address = hash.calculateContractAddressFromHash(publicKey, ACCOUNT_CLASS_HASH, callData, 0);

  if (address.length < 66) {
    address = address.replace('0x', '0x' + '0'.repeat(66 - address.length));
  }
  return {
    address,
    callData,
  };
};

/**
 * calculate contract address by publicKey
 *
 * @param  publicKey - address's publicKey.
 * @returns - address and calldata.
 */
export const getAccContractAddressAndCallDataLegacy = (publicKey) => {
  // [TODO]: Check why use ACCOUNT_CLASS_HASH_LEGACY and PROXY_CONTRACT_HASH ?
  const callData = CallData.compile({
    implementation: ACCOUNT_CLASS_HASH_LEGACY,
    selector: hash.getSelectorFromName('initialize'),
    calldata: CallData.compile({ signer: publicKey, guardian: '0' }),
  });
  let address = hash.calculateContractAddressFromHash(publicKey, PROXY_CONTRACT_HASH, callData, 0);
  if (address.length < 66) {
    address = address.replace('0x', '0x' + '0'.repeat(66 - address.length));
  }
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
    const result = await findAddressIndex(network.chainId, address, keyDeriver, state, maxScan);
    addressIndex = result.index;
  }
  return getKeysFromAddressIndex(keyDeriver, network.chainId, state, addressIndex);
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

/**
 * Check address is deployed by using getVersion
 *
 * @param  network - Network.
 * @param  address - Input address.
 * @returns - boolean.
 */
export const isAccountDeployed = async (network: Network, address: string) => {
  try {
    await getVersion(address, network);
    return true;
  } catch (err) {
    if (!err.message.includes('Contract not found')) {
      throw err;
    }
    return false;
  }
};

export const addFeesFromAllTransactions = (fees: EstimateFee[]): Partial<EstimateFee> => {
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

/**
 * Find address index from the keyDeriver
 *
 * @param  chainId - Network ChainId.
 * @param  address - Input address.
 * @param  keyDeriver - keyDeriver from MetaMask wallet.
 * @param  state - MetaMask Snap state.
 * @param  maxScan - Number of scaning in the keyDeriver.
 * @returns - address index and cairoVersion.
 */
export const findAddressIndex = async (
  chainId: string,
  address: string,
  keyDeriver,
  state: SnapState,
  maxScan = 20,
) => {
  const bigIntAddress = num.toBigInt(address);
  for (let i = 0; i < maxScan; i++) {
    const { publicKey } = await getKeysFromAddressIndex(keyDeriver, chainId, state, i);
    const { address: calculatedAddress, addressLegacy: calculatedAddressLegacy } = getPermutationAddresses(publicKey);

    if (num.toBigInt(calculatedAddress) === bigIntAddress || num.toBigInt(calculatedAddressLegacy) === bigIntAddress) {
      logger.log(`findAddressIndex:\nFound address in scan: ${i} ${address}`);
      return {
        index: i,
        cairoVersion: num.toBigInt(calculatedAddress) === bigIntAddress ? 1 : 0,
      };
    }
  }
  throw new Error(`Address not found: ${address}`);
};

/**
 * Get address permutation by public key
 *
 * @param  pk - Public key.
 * @returns - address and addressLegacy.
 */
export const getPermutationAddresses = (pk: string) => {
  const { address } = getAccContractAddressAndCallData(pk);
  const { address: addressLegacy } = getAccContractAddressAndCallDataLegacy(pk);

  return {
    address,
    addressLegacy,
  };
};

/**
 * Check address needed deploy by using getVersion and check if eth balance is non empty.
 *
 * @param  network - Network.
 * @param  address - Input address.
 * @returns - boolean.
 */
export const isDeployRequired = async (network: Network, address: string, pubKey: string) => {
  logger.log(`isDeployRequired: address = ${address}`);
  const { address: addressLegacy } = getAccContractAddressAndCallDataLegacy(pubKey);

  try {
    if (address === addressLegacy) {
      await getVersion(address, network);
    }
    return false;
  } catch (err) {
    if (!err.message.includes('Contract not found')) {
      throw err;
    }
    return !(await isEthBalanceEmpty(network, address));
  }
};

/**
 * Check address needed upgrade by using getVersion and compare with MIN_ACC_CONTRACT_VERSION
 *
 * @param  network - Network.
 * @param  address - Input address.
 * @returns - boolean.
 */
export const isUpgradeRequired = async (network: Network, address: string) => {
  try {
    logger.log(`isUpgradeRequired: address = ${address}`);
    const hexResp = await getVersion(address, network);
    return isGTEMinVersion(hexToString(hexResp)) ? false : true;
  } catch (err) {
    if (!err.message.includes('Contract not found')) {
      throw err;
    }
    //[TODO] if address is cairo0 but not deployed we throw error
    return false;
  }
};

/**
 * Compare version number with MIN_ACC_CONTRACT_VERSION
 *
 * @param  version - version, e.g (2.3.0).
 * @returns - boolean.
 */
export const isGTEMinVersion = (version: string) => {
  logger.log(`isGTEMinVersion: version = ${version}`);
  const versionArr = version.split('.');
  return Number(versionArr[1]) >= MIN_ACC_CONTRACT_VERSION[1];
};

/**
 * Generate the transaction invocation object for upgrading a contract.
 *
 * @param contractAddress - The address of the contract to upgrade.
 * @returns An object representing the transaction invocation.
 */
export function getUpgradeTxnInvocation(contractAddress: string) {
  const method = 'upgrade';

  const calldata = CallData.compile({
    implementation: ACCOUNT_CLASS_HASH,
    calldata: [0],
  });

  return {
    contractAddress,
    entrypoint: method,
    calldata,
  };
}

/**
 * Calculate the transaction fee for upgrading a contract.
 *
 * @param network - The network on which the contract is deployed.
 * @param contractAddress - The address of the contract to upgrade.
 * @param privateKey - The private key of the account performing the upgrade.
 * @param maxFee - The maximum fee allowed for the transaction.
 * @returns The calculated transaction fee as a bigint.
 */
export async function estimateAccountUpgradeFee(
  network: Network,
  contractAddress: string,
  privateKey: string,
  maxFee: BigNumberish = constants.ZERO,
) {
  if (maxFee === constants.ZERO) {
    const txnInvocation = getUpgradeTxnInvocation(contractAddress);
    const estFeeResp = await estimateFee(network, contractAddress, privateKey, txnInvocation, CAIRO_VERSION_LEGACY);
    return num.toBigInt(estFeeResp.suggestedMaxFee.toString(10) ?? '0');
  }
  return maxFee;
}

/**
 * Get user address by public key, return address if the address has deployed
 *
 * @param  network - Network.
 * @param  publicKey - address's public key.
 * @returns - address and address's public key.
 */
export const getCorrectContractAddress = async (network: Network, publicKey: string, maxFee = constants.ZERO) => {
  const { address: contractAddress, addressLegacy: contractAddressLegacy } = getPermutationAddresses(publicKey);

  logger.log(
    `getContractAddressByKey: contractAddress = ${contractAddress}\ncontractAddressLegacy = ${contractAddressLegacy}\npublicKey = ${publicKey}`,
  );

  let address = contractAddress;
  let upgradeRequired = false;
  let deployRequired = false;
  let pk = '';

  try {
    await getVersion(contractAddress, network);
    pk = await getContractOwner(address, network, CAIRO_VERSION);
  } catch (e) {
    if (!e.message.includes('Contract not found')) {
      throw e;
    }

    logger.log(`getContractAddressByKey: cairo ${CAIRO_VERSION} contract not found, try cairo ${CAIRO_VERSION_LEGACY}`);

    try {
      address = contractAddressLegacy;
      const version = await getVersion(contractAddressLegacy, network);
      upgradeRequired = isGTEMinVersion(hexToString(version)) ? false : true;
      pk = await getContractOwner(
        contractAddressLegacy,
        network,
        upgradeRequired ? CAIRO_VERSION_LEGACY : CAIRO_VERSION,
      );
    } catch (e) {
      if (!e.message.includes('Contract not found')) {
        throw e;
      }
      // Here account is not deployed, proceed with edge case detection
      try {
        if (await isEthBalanceEmpty(network, address, maxFee)) {
          address = contractAddress;
          logger.log(`getContractAddressByKey: no deployed contract found, fallback to cairo ${CAIRO_VERSION}`);
        } else {
          upgradeRequired = true;
          deployRequired = true;
          logger.log(
            `getContractAddressByKey: non deployed cairo0 contract found with non-zero balance, force cairo ${CAIRO_VERSION_LEGACY}`,
          );
        }
      } catch (err) {
        logger.log(`getContractAddressByKey: balance check failed with error ${err}`);
        throw err;
      }
    }
  }

  return {
    address,
    signerPubKey: pk,
    upgradeRequired,
    deployRequired,
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

export const signDeclareTransaction = async (
  privateKey: string,
  transaction: DeclareSignerDetails,
): Promise<Signature> => {
  const signer = new Signer(privateKey);
  const signatures = await signer.signDeclareTransaction(transaction);
  return stark.signatureToDecimalArray(signatures);
};

export const signMessage = async (privateKey: string, typedDataMessage: TypedData, signerUserAddress: string) => {
  const signer = new Signer(privateKey);
  const signatures = await signer.signMessage(typedDataMessage, signerUserAddress);
  return stark.signatureToDecimalArray(signatures);
};

export const getStarkNameUtil = async (network: Network, userAddress: string) => {
  const provider = getProvider(network);
  return Account.getStarkName(provider, userAddress);
};

export const validateAccountRequireUpgradeOrDeploy = async (network: Network, address: string, pubKey: string) => {
  if (await isUpgradeRequired(network, address)) {
    throw new UpgradeRequiredError('Upgrade required');
  } else if (await isDeployRequired(network, address, pubKey)) {
    throw new DeployRequiredError(`Cairo 0 contract address ${address} balance is not empty, deploy required`);
  }
};
