import { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import {
  ec,
  json,
  hash,
  number,
  typedData,
  Signature,
  constants,
  stark,
  Provider,
  Account,
  KeyPair,
  Call,
  DeployContractResponse,
  InvokeFunctionResponse,
  EstimateFee,
  RawCalldata,
  CallContractResponse,
  ProviderOptions,
  GetTransactionResponse,
  TransactionBulk,
} from 'starknet';
import * as starknet_v4_6_0 from 'starknet_v4.6.0';
import { Network, SnapState, Transaction, TransactionType } from '../types/snapState';
import { PROXY_CONTRACT_HASH, TRANSFER_SELECTOR_HEX } from './constants';
import { getAddressKey } from './keyPair';
import { getAccount, getAccounts, getTransactionFromVoyagerUrl, getTransactionsFromVoyagerUrl } from './snapUtils';

export const getCallDataArray = (callDataStr: string): string[] => {
  return (callDataStr ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
};

export const getProvider = (network: Network): Provider => {
  let providerParam: ProviderOptions = {};
  // same precedence as defined in starknet.js Provider class constructor
  if (network.nodeUrl) {
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

export const getProvider_v4_6_0 = (network: Network): starknet_v4_6_0.Provider => {
  let providerParam: starknet_v4_6_0.ProviderOptions = {};
  // same precedence as defined in starknet.js Provider class constructor
  if (network.nodeUrl) {
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
  return new starknet_v4_6_0.Provider(providerParam);
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
  senderKeyPair: KeyPair,
  txnInvocation: Call | Call[],
): Promise<EstimateFee> => {
  const provider = getProvider(network);
  const account = new Account(provider, senderAddress, senderKeyPair);
  return account.estimateInvokeFee(txnInvocation, { blockIdentifier: 'latest' });
};

export const estimateFeeBulk = async (
  network: Network,
  senderAddress: string,
  senderKeyPair: KeyPair,
  txnInvocation: TransactionBulk,
): Promise<EstimateFee[]> => {
  const provider = getProvider(network);
  const account = new Account(provider, senderAddress, senderKeyPair);
  return account.estimateFeeBulk(txnInvocation, { blockIdentifier: 'latest' });
};

export const estimateFee_v4_6_0 = async (
  network: Network,
  senderAddress: string,
  senderKeyPair: KeyPair,
  txnInvocation: Call | Call[],
): Promise<starknet_v4_6_0.EstimateFee> => {
  const provider = getProvider_v4_6_0(network);
  const account = new starknet_v4_6_0.Account(provider, senderAddress, senderKeyPair);
  return account.estimateFee(txnInvocation, { blockIdentifier: 'latest' });
};

export const executeTxn = async (
  network: Network,
  senderAddress: string,
  senderKeyPair: KeyPair,
  txnInvocation: Call | Call[],
  maxFee: number.BigNumberish,
  nonce?: number,
): Promise<InvokeFunctionResponse> => {
  const provider = getProvider(network);
  const account = new Account(provider, senderAddress, senderKeyPair);
  return account.execute(txnInvocation, undefined, { nonce, maxFee });
};

export const executeTxn_v4_6_0 = async (
  network: Network,
  senderAddress: string,
  senderKeyPair: KeyPair,
  txnInvocation: Call | Call[],
  maxFee: number.BigNumberish,
  nonce?: number,
): Promise<starknet_v4_6_0.InvokeFunctionResponse> => {
  const provider = getProvider_v4_6_0(network);
  const account = new starknet_v4_6_0.Account(provider, senderAddress, senderKeyPair);
  return account.execute(txnInvocation, undefined, { nonce, maxFee });
};

export const deployAccount = async (
  network: Network,
  contractAddress: string,
  contractCallData: RawCalldata,
  addressSalt: number.BigNumberish,
  keyPair: KeyPair,
  maxFee: number.BigNumberish,
): Promise<DeployContractResponse> => {
  const provider = getProvider(network);
  const account = new Account(provider, contractAddress, keyPair);
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
  addressSalt: number.BigNumberish,
  keyPair: KeyPair,
): Promise<EstimateFee> => {
  const provider = getProvider(network);
  const account = new Account(provider, contractAddress, keyPair);
  const deployAccountPayload = {
    classHash: PROXY_CONTRACT_HASH,
    contractAddress: contractAddress,
    constructorCalldata: contractCallData,
    addressSalt,
  };
  return account.estimateAccountDeployFee(deployAccountPayload);
};

export const getSigner = async (userAccAddress: string, network: Network): Promise<string> => {
  const resp = await callContract(network, userAccAddress, network.useOldAccounts ? 'get_signer' : 'getSigner');
  return resp.result[0];
};

export const getTransactionStatus = async (transactionHash: number.BigNumberish, network: Network) => {
  const provider = getProvider(network);
  return (await provider.getTransactionReceipt(transactionHash)).status;
};

export const getTransactionFromSequencer = async (transactionHash: number.BigNumberish, network: Network) => {
  const provider = getProvider(network);
  return provider.getTransaction(transactionHash);
};

export const getTransactionsFromVoyager = async (
  toAddress: number.BigNumberish,
  pageSize: number,
  pageNum: number,
  network: Network,
) => {
  let toQueryStr = '';
  if (toAddress) {
    toQueryStr = `to=${number.toHex(number.toBN(toAddress))}&`;
  }

  // "ps" only effective on value: 10, 25, 50 as what's currently available in Voyager page
  return getData(`${getTransactionsFromVoyagerUrl(network)}?${toQueryStr}ps=${pageSize}&p=${pageNum}`);
};

export const getTransactionFromVoyager = async (transactionHash: number.BigNumberish, network: Network) => {
  const txHashHex = number.toHex(number.toBN(transactionHash));
  return getData(`${getTransactionFromVoyagerUrl(network)}/${txHashHex}`);
};

const getTransactionsFromVoyagerHelper = async (
  toAddress: number.BigNumberish,
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
      console.error(`getTransactionsFromVoyagerHelper: error received from getTransactionsFromVoyager: ${err}`);
    }
    i++;
  } while (i <= maxPage && txns[txns.length - 1]?.timestamp * 1000 >= minTimestamp);
  console.log(
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
        console.error(
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
  toAddress: number.BigNumberish,
  contractAddress: number.BigNumberish,
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

  let massagedTxns = await Promise.all(
    txns.map(async (txn) => {
      let txnResp: GetTransactionResponse;
      try {
        txnResp = await getTransactionFromSequencer(txn.hash, network);
        console.log(`getMassagedTransactions: txnResp:\n${JSON.stringify(txnResp)}`);
      } catch (err) {
        console.error(`getMassagedTransactions: error received from getTransactionFromVoyager: ${err}`);
      }

      const massagedTxn: Transaction = {
        txnHash: txnResp.transaction_hash || txn.hash,
        txnType: txn.type?.toLowerCase(),
        chainId: network.chainId,
        senderAddress: txnResp.sender_address || txnResp.contract_address || txn.contract_address || '',
        contractAddress: txnResp.calldata?.[1] || txnResp.contract_address || txn.contract_address || '',
        contractFuncName: number.toBN(txnResp.calldata?.[2]).eq(number.toBN(TRANSFER_SELECTOR_HEX)) ? 'transfer' : '',
        contractCallData: txnResp.calldata?.slice(6, txnResp.calldata?.length - 1) || [],
        timestamp: txn.timestamp,
        status: txnResp['status'] || txn.status || '',
        eventIds: [],
        failureReason: '',
      };

      return massagedTxn;
    }),
  );

  console.log(`getMassagedTransactions: massagedTxns total = ${massagedTxns.length}`);
  console.log(`getMassagedTransactions: massagedTxns:\n${JSON.stringify(massagedTxns)}`);

  if (contractAddress) {
    massagedTxns = massagedTxns.filter(
      (massagedTxn) =>
        number.toBN(massagedTxn.contractAddress).eq(number.toBN(contractAddress)) ||
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

export function getKeyPairFromPrivateKey(privateKey: number.BigNumberish) {
  return ec.getKeyPair(privateKey);
}

export const getTypedDataMessageSignature = (
  signerKeyPair,
  typedDataMessage: typedData.TypedData,
  signerUserAddress: string,
) => {
  const msgHash = typedData.getMessageHash(typedDataMessage, signerUserAddress);
  return ec.sign(signerKeyPair, msgHash);
};

export const verifyTypedDataMessageSignature = (
  signerKeyPair,
  typedDataMessage: typedData.TypedData,
  signerUserAddress: number.BigNumberish,
  signature: Signature,
) => {
  const msgHash = typedData.getMessageHash(typedDataMessage, signerUserAddress);
  return ec.verify(signerKeyPair, msgHash, signature);
};

export const getNextAddressIndex = (chainId: string, state: SnapState, derivationPath: string) => {
  const accounts = getAccounts(state, chainId).filter(
    (acc) => acc.derivationPath === derivationPath && acc.addressIndex >= 0,
  );
  const uninitializedAccount = accounts.find(
    (acc) => !acc.publicKey || number.toBN(acc.publicKey).eq(number.toBN(constants.ZERO)),
  );
  console.log(
    `getNextAddressIndex:\nUninitialized account found from state:\n${JSON.stringify(uninitializedAccount ?? 'None')}`,
  );
  return uninitializedAccount?.addressIndex ?? accounts.length;
};

export const getAccContractAddressAndCallData = (accountClassHash: string, publicKey) => {
  const callData = stark.compileCalldata({
    implementation: accountClassHash,
    selector: hash.getSelectorFromName('initialize'),
    calldata: stark.compileCalldata({ signer: publicKey, guardian: '0' }),
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
    console.log(`getNextAddressIndex:\nFound address in state: ${addressIndex} ${address}`);
  } else {
    for (let i = 0; i < maxScan; i++) {
      const { publicKey } = await getKeysFromAddressIndex(
        keyDeriver,
        network.chainId,
        state,
        i,
        network.useOldAccounts,
      );
      const { address: calculatedAddress } = getAccContractAddressAndCallData(network.accountClassHash, publicKey);
      if (number.toBN(calculatedAddress).eq(number.toBN(address))) {
        addressIndex = i;
        console.log(`getNextAddressIndex:\nFound address in scan: ${addressIndex} ${address}`);
        break;
      }
    }
  }

  if (!isNaN(addressIndex)) {
    return getKeysFromAddressIndex(keyDeriver, network.chainId, state, addressIndex, network.useOldAccounts);
  }
  return null;
};

export const getKeysFromAddressIndex = async (
  keyDeriver: BIP44AddressKeyDeriver,
  chainId: string,
  state: SnapState,
  index: number = undefined,
  useOldAccounts = false,
) => {
  let addressIndex = index;
  if (isNaN(addressIndex) || addressIndex < 0) {
    addressIndex = getNextAddressIndex(chainId, state, keyDeriver.path);
    console.log(`getKeysFromAddressIndex: addressIndex found: ${addressIndex}`);
  }

  const { addressKey, derivationPath } = await getAddressKey(keyDeriver, addressIndex, useOldAccounts);
  const starkKeyPair = ec.getKeyPair(addressKey);
  const starkKeyPub = ec.getStarkKey(starkKeyPair);
  const starkKeyPrivate = number.toHex(starkKeyPair.getPrivate());
  return {
    privateKey: starkKeyPrivate,
    publicKey: starkKeyPub,
    addressIndex,
    derivationPath,
    keyPair: starkKeyPair,
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

  return accountDeployed;
};

export const addFeesFromAllTransactions = (fees: EstimateFee[]): EstimateFee => {
  let overall_fee_bn = number.toBN(0);
  let suggestedMaxFee_bn = number.toBN(0);

  fees.forEach((fee) => {
    overall_fee_bn = overall_fee_bn.add(fee.overall_fee);
    suggestedMaxFee_bn = suggestedMaxFee_bn.add(fee.suggestedMaxFee);
  });

  return {
    overall_fee: overall_fee_bn,
    suggestedMaxFee: suggestedMaxFee_bn,
  };
};
