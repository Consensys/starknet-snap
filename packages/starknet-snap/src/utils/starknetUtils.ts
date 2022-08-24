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
  CompiledContract,
  ProviderOptions,
} from 'starknet';
import { Network, SnapState, Transaction, TransactionType } from '../types/snapState';
import { CONTRACT_ADDRESS_PREFIX, PROXY_CONTRACT_HASH } from './constants';
import { getAddressKey } from './keyPair';
import {
  getAccount,
  getAccounts,
  getNetwork,
  getTransactionFromVoyagerUrl,
  getTransactionsFromVoyagerUrl,
} from './snapUtils';

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

export const callContract = async (
  network: Network,
  contractAddress: string,
  contractFuncName: string,
  contractCallData: RawCalldata = [],
): Promise<CallContractResponse> => {
  const provider = getProvider(network);
  return provider.callContract({
    contractAddress,
    entrypoint: contractFuncName,
    calldata: contractCallData,
  });
};

export const estimateFee = async (
  network: Network,
  senderAddress: string,
  senderKeyPair: KeyPair,
  txnInvocation: Call | Call[],
): Promise<EstimateFee> => {
  const provider = getProvider(network);
  const account = new Account(provider, senderAddress, senderKeyPair);
  return account.estimateFee(txnInvocation, { blockIdentifier: 'latest' });
};

export const executeTxn = async (
  network: Network,
  senderAddress: string,
  senderKeyPair: KeyPair,
  txnInvocation: Call | Call[],
  maxFee: number.BigNumberish,
): Promise<InvokeFunctionResponse> => {
  const provider = getProvider(network);
  const account = new Account(provider, senderAddress, senderKeyPair);
  return account.execute(txnInvocation, undefined, {
    maxFee,
  });
};

export const deployContract = async (
  network: Network,
  contract: CompiledContract | string,
  constructorCalldata: RawCalldata,
  addressSalt: number.BigNumberish,
): Promise<DeployContractResponse> => {
  const provider = getProvider(network);
  return provider.deployContract({
    contract,
    constructorCalldata,
    addressSalt,
  });
};

export const getNonce = async (userAccAddress: string, network: Network): Promise<string> => {
  const resp = await callContract(network, userAccAddress, 'get_nonce');
  return resp.result[0];
};

export const getSigner = async (userAccAddress: string, network: Network): Promise<string> => {
  const resp = await callContract(network, userAccAddress, 'get_signer');
  return resp.result[0];
};

export const getTransactionStatus = async (transactionHash: number.BigNumberish, network: Network) => {
  const provider = getProvider(network);
  return (await provider.getTransactionReceipt(transactionHash)).status;
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
        deployTxns = lastPageTxns.filter((txn) => txn.type.toLowerCase() === TransactionType.DEPLOY.toLowerCase());
        txns = [...txns, ...deployTxns];
      } catch (err) {
        console.error(
          `getTransactionsFromVoyagerHelper: error received from getTransactionsFromVoyager at last page: ${err}`,
        );
      }
    } else {
      deployTxns = txns.filter((txn) => txn.type.toLowerCase() === TransactionType.DEPLOY.toLowerCase());
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
      let txnResp;
      try {
        txnResp = await getTransactionFromVoyager(txn.hash, network);
      } catch (err) {
        console.error(`getMassagedTransactions: error received from getTransactionFromVoyager: ${err}`);
      }

      const massagedTxn: Transaction = {
        txnHash: txnResp?.header?.hash || txn.hash,
        txnType: txnResp?.header?.type || txn.type,
        chainId: network.chainId,
        senderAddress: txnResp?.header?.to || txn.to,
        contractAddress: txnResp?.argentxMetadata?.calldata?.[0]?.value || txnResp?.header?.to || txn.to,
        contractFuncName: txnResp?.argentxMetadata?.functionNames?.[0] || '',
        contractCallData:
          txnResp?.argentxMetadata?.calldata
            ?.slice(2, txnResp.argentxMetadata.calldata?.length - 1)
            .map((data) => data.value) || [],
        timestamp: txnResp?.header?.timestamp || txn.timestamp,
        status: txnResp?.header?.status || txn.status,
        eventIds: txnResp?.receipt?.events?.map((event) => event.id) || [],
        failureReason: '',
      };

      return massagedTxn;
    }),
  );

  console.log(`getMassagedTransactions: massagedTxns total = ${massagedTxns.length}`);

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

export const calculateContractAddress = (
  salt: number.BigNumberish,
  contractHash: number.BigNumberish,
  constructorCalldata: number.BigNumberish[],
  callerAddress: number.BigNumberish = 0,
): string => {
  const constructorCalldataHash = hash.computeHashOnElements(constructorCalldata);
  return hash.computeHashOnElements([
    CONTRACT_ADDRESS_PREFIX,
    callerAddress,
    salt,
    contractHash,
    constructorCalldataHash,
  ]);
};

export const getNextAddressIndex = (chainId: string, state: SnapState, derivationPath: string) => {
  const accounts = getAccounts(state, chainId).filter(
    (acc) => acc.derivationPath === derivationPath && acc.addressIndex >= 0,
  );
  const uninitializedAccounts = accounts.find(
    (acc) => !acc.publicKey || number.toBN(acc.publicKey).eq(number.toBN(constants.ZERO)),
  );
  console.log(`getNextAddressIndex:\nAccount found from state:\n${JSON.stringify(uninitializedAccounts)}`);
  return uninitializedAccounts?.addressIndex ?? accounts.length;
};

export const getAccContractAddressAndCallData = (accountClassHash: string, publicKey) => {
  const callData = stark.compileCalldata({
    implementation: accountClassHash,
    selector: hash.getSelectorFromName('initialize'),
    calldata: stark.compileCalldata({ signer: publicKey, guardian: '0' }),
  });
  const address = calculateContractAddress(publicKey, PROXY_CONTRACT_HASH, callData);

  return {
    address,
    callData,
  };
};

export const getKeysFromAddress = async (
  keyDeriver,
  chainId: string,
  state: SnapState,
  address: string,
  maxScan = 20,
) => {
  let addressIndex;
  const network = getNetwork(state, chainId);
  const acc = getAccount(state, address, chainId);
  if (acc) {
    addressIndex = acc.addressIndex;
    console.log(`getNextAddressIndex:\nFound address in state: ${addressIndex} ${address}`);
  } else {
    for (let i = 0; i < maxScan; i++) {
      const { publicKey } = await getKeysFromAddressIndex(keyDeriver, chainId, state, i);
      const { address: calculatedAddress } = getAccContractAddressAndCallData(network.accountClassHash, publicKey);
      if (number.toBN(calculatedAddress).eq(number.toBN(address))) {
        addressIndex = i;
        console.log(`getNextAddressIndex:\nFound address in scan: ${addressIndex} ${address}`);
        break;
      }
    }
  }

  if (!isNaN(addressIndex)) {
    return getKeysFromAddressIndex(keyDeriver, chainId, state, addressIndex);
  }
  return null;
};

export const getKeysFromAddressIndex = async (
  keyDeriver,
  chainId: string,
  state: SnapState,
  index: number = undefined,
) => {
  let addressIndex = index;
  if (isNaN(addressIndex) || addressIndex < 0) {
    addressIndex = getNextAddressIndex(chainId, state, keyDeriver.path);
    console.log(`getKeysFromAddressIndex: addressIndex found: ${addressIndex}`);
  }

  const { addressKey, derivationPath } = await getAddressKey(keyDeriver, addressIndex);
  const starkKeyPair = ec.getKeyPair(addressKey);
  const starkKeyPub = ec.getStarkKey(starkKeyPair);
  const starkKeyPrivate = number.toHex(starkKeyPair.getPrivate());
  return {
    privateKey: starkKeyPrivate,
    publicKey: starkKeyPub,
    addressIndex,
    derivationPath,
  };
};
