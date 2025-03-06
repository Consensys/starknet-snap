import {
  BIP44CoinTypeNode,
  getBIP44AddressKeyDeriver,
} from '@metamask/key-tree';
import type { UserInputEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { generateMnemonic } from 'bip39';
import { getRandomValues } from 'crypto';
import type { EstimateFee } from 'starknet';
import {
  constants,
  ec,
  CallData,
  hash,
  type Calldata,
  num as numUtils,
  TransactionFinalityStatus,
  TransactionExecutionStatus,
  TransactionType,
  validateAndParseAddress,
} from 'starknet';
import { v4 as uuidv4 } from 'uuid';

import type {
  StarkScanTransaction,
  StarkScanTransactionsResponse,
} from '../chain/data-client/starkscan.type';
import { FeeToken } from '../types/snapApi';
import {
  ContractFuncName,
  TransactionDataVersion,
  type AccContract,
  type Transaction,
  type TransactionRequest,
} from '../types/snapState';
import { getDefaultAccountName } from '../utils/account';
import {
  ACCOUNT_CLASS_HASH,
  ACCOUNT_CLASS_HASH_LEGACY,
  PRELOADED_TOKENS,
  PROXY_CONTRACT_HASH,
} from '../utils/constants';
import { grindKey } from '../utils/keyPair';
import { invokeTx, cairo0DeployTx } from './fixture/stark-scan-example.json';

/* eslint-disable */
export type StarknetAccount = AccContract & {
  privateKey: string;
};

/* eslint-disable */

/**
 * Using pseudorandom number generators (PRNGs) to generate a security-sensitive random value that recommended by sonarcloud.
 * It has led in the past to the following vulnerabilities:
 * - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2013-6386
 * - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2006-3419
 * - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2008-4102
 *
 * @returns An random number.
 */
export function generateRandomValue() {
  // max value of 32 bit signed integer
  const maxU32 = 2 ** 32;
  const u32Arr = new Uint32Array(1);
  // by dividing the random value by maxU32, we get a decimal number between 0 and 1, which is the same as Math.random()
  return getRandomValues(u32Arr)[0] / maxU32;
}

/**
 * Method to get a random value.
 *
 * @param dataLength - The length of the data.
 * @returns An random number.
 */
export function getRandomValue(dataLength: number) {
  return Math.floor(generateRandomValue() * dataLength);
}

/**
 * Method to get a random data.
 *
 * @param data - The data to get a random value.
 * @returns A random data.
 * */
export function getRandomData<DataType>(data: DataType[]) {
  return data[getRandomValue(data.length)];
}

const SixtyThreeHexInBigInt = BigInt(
  '1000000000000000000000000000000000000000000000000000000000000000000000000000',
);

/**
 * Method to generate Bip44 Entropy.
 *
 * @param mnemonic - The random mnemonic of the wallet.
 * @param coinType - The coin type of the bip44, default is 9004 - Starknet Coin.
 * @returns An Bip44 Node.
 */
export async function generateBip44Entropy(
  mnemonic: string,
  coinType: number = 9004,
) {
  return await BIP44CoinTypeNode.fromDerivationPath([
    `bip39:${mnemonic}`,
    "bip32:44'",
    `bip32:${coinType}'`,
  ]);
}

/**
 * Method to generate Bip44 Node by index.
 *
 * @param [mnemonic] - Optional, the provided mnemonic string.
 * @returns The deriver function for the derivation path.
 */
export async function generateKeyDeriver(mnemonic?: string) {
  let mnemonicString = mnemonic;
  if (!mnemonicString) {
    mnemonicString = generateMnemonic();
  }
  const node = await generateBip44Entropy(mnemonicString);
  return await getBIP44AddressKeyDeriver(node);
}

/**
 * Method to generate starknet account.
 *
 * @param network - Starknet Chain Id.
 * @param cnt - Number of accounts to generate.
 * @param cairoVersion - Cairo version of the generated accounts.
 * @returns An array of StarknetAccount object.
 */
export async function generateAccounts(
  network: constants.StarknetChainId | string,
  cnt: number = 1,
  cairoVersion = '1',
  startIndex = 0,
  mnemonicString: string = generateMnemonic(),
) {
  const accounts: StarknetAccount[] = [];

  for (let i = startIndex; i < startIndex + cnt; i++) {
    // simulate the bip44 entropy generation
    const keyDeriver = await generateKeyDeriver(mnemonicString);
    const { privateKey } = await keyDeriver(i);

    if (!privateKey) {
      throw new Error('Private key is not defined');
    }

    // simulate the same flow in code base
    const addressKey = grindKey(privateKey);
    const pubKey = ec.starkCurve.getStarkKey(addressKey);

    let address = '';
    let callData: Calldata;
    let accountClassHash: string;

    if (cairoVersion === '1') {
      callData = CallData.compile({
        signer: pubKey,
        guardian: '0',
      });
      accountClassHash = ACCOUNT_CLASS_HASH;
    } else {
      callData = CallData.compile({
        implementation: ACCOUNT_CLASS_HASH_LEGACY,
        selector: hash.getSelectorFromName('initialize'),
        calldata: CallData.compile({ signer: pubKey, guardian: '0' }),
      });
      accountClassHash = PROXY_CONTRACT_HASH;
    }

    address = hash.calculateContractAddressFromHash(
      pubKey,
      accountClassHash,
      callData,
      0,
    );

    address = validateAndParseAddress(address);

    accounts.push({
      addressSalt: pubKey,
      privateKey: numUtils.toHex(addressKey),
      publicKey: pubKey,
      address: address,
      addressIndex: i,
      derivationPath: keyDeriver.path,
      deployTxnHash: '',
      chainId: network,
      accountName: getDefaultAccountName(i + 1),
    });
  }
  return accounts;
}

/**
 * Method to generate transactions.
 *
 * @param params
 * @param params.chainId - Starknet Chain Id.
 * @param params.address - Address of the account.
 * @param params.contractAddresses - Contract addresses to generate transactions.
 * @param params.txnTypes - Array of transaction types.
 * @param params.finalityStatuses - Array of transaction finality status.
 * @param params.executionStatuses - Array of transaction execution status.
 * @param params.cnt - Number of transaction to generate.
 * @param params.timestamp - The timestamp of the first transaction.
 * @param params.transactionVersions - The transaction version, 1 or 3, where 3 represents the fee will be paid in STRK.
 * @returns An array of transaction object.
 */
export function generateTransactions({
  chainId,
  address,
  baseTxnHashInBigInt = SixtyThreeHexInBigInt,
  contractAddresses = PRELOADED_TOKENS.map((token) => token.address),
  txnTypes = Object.values(TransactionType),
  finalityStatuses = Object.values(TransactionFinalityStatus),
  executionStatuses = Object.values(TransactionExecutionStatus),
  // The timestamp from data source is in seconds
  timestamp = Math.floor(Date.now() / 1000),
  transactionVersions = [1, 3],
  cnt = 1,
}: {
  chainId: constants.StarknetChainId | string;
  address: string;
  contractAddresses?: string[];
  txnTypes?: TransactionType[];
  finalityStatuses?: TransactionFinalityStatus[];
  executionStatuses?: TransactionExecutionStatus[];
  timestamp?: number;
  cnt?: number;
  transactionVersions?: number[];
  baseTxnHashInBigInt?: bigint;
}): Transaction[] {
  let baseTimeStamp = timestamp;
  let createCnt = cnt;
  let _txnTypes = txnTypes;
  const transactions: Transaction[] = [];

  // only 1 deploy account transaction to generate
  if (
    txnTypes.includes(TransactionType.DEPLOY_ACCOUNT) ||
    txnTypes.includes(TransactionType.DEPLOY)
  ) {
    transactions.push(
      generateDeployTransaction({
        address,
        txnHash: getTransactionHash(baseTxnHashInBigInt),
        timestamp: baseTimeStamp,
        version: getRandomData(transactionVersions),
        chainId,
      }),
    );

    createCnt -= 1;

    // after generate a deploy transaction, we dont need to re-generate another deploy transaction,
    // so we can remove it from the txnTypes, to make sure we only random the types that are not deploy.
    _txnTypes = txnTypes.filter(
      (type) =>
        type !== TransactionType.DEPLOY_ACCOUNT &&
        type !== TransactionType.DEPLOY,
    );
  }

  for (let i = 1; i <= createCnt; i++) {
    // Make sure the timestamp is increasing
    baseTimeStamp += i * 100;
    // Make sure the txn hash is unique
    baseTxnHashInBigInt += BigInt(i * 100);

    const executionStatus = getRandomData(executionStatuses);
    const finalityStatus =
      executionStatus === TransactionExecutionStatus.REJECTED
        ? TransactionFinalityStatus.ACCEPTED_ON_L2
        : getRandomData(finalityStatuses);
    const txnType = getRandomData(_txnTypes);
    const contractFuncName =
      txnType == TransactionType.INVOKE
        ? getRandomData(Object.values(ContractFuncName))
        : '';

    transactions.push(
      generateInvokeTransaction({
        address,
        contractAddress: getRandomData(contractAddresses),
        txnHash: getTransactionHash(baseTxnHashInBigInt),
        timestamp: baseTimeStamp,
        version: getRandomData(transactionVersions),
        chainId,
        txnType,
        finalityStatus,
        executionStatus,
        contractFuncName,
      }),
    );
  }

  return transactions.sort((a, b) => b.timestamp - a.timestamp);
}

function getTransactionTemplate() {
  return {
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    timestamp: 0,
    senderAddress: '',
    contractAddress: '',
    txnHash: '',
    txnType: '',
    failureReason: '',
    executionStatus: '',
    finalityStatus: '',
    accountCalls: null,
    version: 1,
    maxFee: null,
    actualFee: null,
    dataVersion: TransactionDataVersion.V2,
  };
}

/**
 * Method to generate a deploy transaction.
 *
 * @param params
 * @param params.address - The address of the account.
 * @param params.txnHash - The transaction hash.
 * @param params.timestamp - The timestamp of the transaction.
 * @param params.version - The version of the transaction.
 * @param params.chainId - The chain id of the transaction.
 * @returns A transaction object.
 * */
export function generateDeployTransaction({
  address,
  txnHash,
  timestamp,
  version,
  chainId,
}: {
  address: string;
  txnHash: string;
  timestamp: number;
  version: number;
  chainId: constants.StarknetChainId | string;
}): Transaction {
  const transaction = getTransactionTemplate();

  return {
    ...transaction,
    chainId: chainId,
    txnHash,
    senderAddress: address,
    contractAddress: address,
    txnType: TransactionType.DEPLOY_ACCOUNT,
    finalityStatus: TransactionFinalityStatus.ACCEPTED_ON_L1,
    executionStatus: TransactionExecutionStatus.SUCCEEDED,
    timestamp: timestamp,
    version: version,
  };
}

/**
 * Method to generate an invoke transaction.
 *
 * @param params
 * @param params.address - The address of the account.
 * @param params.contractAddress - The contract address.
 * @param params.txnHash - The transaction hash.
 * @param params.timestamp - The timestamp of the transaction.
 * @param params.version - The version of the transaction.
 * @param params.chainId - The chain id of the transaction.
 * @param params.txnType - The type of the transaction.
 * @param params.finalityStatus - The finality status of the transaction.
 * @param params.executionStatus - The execution status of the transaction.
 * @param params.contractFuncName - The contract function name.
 * @returns A transaction object.
 * */
export function generateInvokeTransaction({
  address,
  contractAddress,
  txnHash,
  timestamp,
  version,
  chainId,
  txnType,
  finalityStatus,
  executionStatus,
  contractFuncName,
}: {
  address: string;
  txnHash: string;
  contractAddress: string;
  timestamp: number;
  version: number;
  chainId: constants.StarknetChainId | string;
  finalityStatus: TransactionFinalityStatus;
  executionStatus: TransactionExecutionStatus;
  txnType: TransactionType;
  contractFuncName: string;
}): Transaction {
  const transaction = getTransactionTemplate();

  return {
    ...transaction,
    chainId: chainId,
    contractAddress: '',
    txnType,
    finalityStatus,
    executionStatus,
    timestamp,
    txnHash,
    senderAddress: address,
    accountCalls: {
      [contractAddress]: [
        {
          contract: contractAddress,
          contractFuncName,
          contractCallData: [address, getRandomValue(1000).toString(16)],
        },
      ],
    },
    version: version,
  };
}

/**
 * Method to generate a random transaction hash.
 *
 * @param base - The base number to generate the transaction hash.
 * @returns A transaction hash.
 * */
export function getTransactionHash(base = SixtyThreeHexInBigInt) {
  return `0x0` + base.toString(16);
}

export function generateTransactionRequests({
  chainId,
  address,
  selectedFeeTokens = Object.values(FeeToken),
  contractAddresses = PRELOADED_TOKENS.map((token) => token.address),
  cnt = 1,
}: {
  chainId: constants.StarknetChainId | string;
  address: string;
  selectedFeeTokens?: FeeToken[];
  contractAddresses?: string[];
  cnt?: number;
}): TransactionRequest[] {
  const request = {
    chainId: chainId,
    id: '',
    interfaceId: '',
    type: '',
    signer: '',
    maxFee: '',
    calls: [],
    feeToken: '',
  };
  const requests: TransactionRequest[] = [];

  for (let i = 0; i < cnt; i++) {
    requests.push({
      ...request,
      id: uuidv4(),
      interfaceId: uuidv4(),
      type: TransactionType.INVOKE,
      networkName: 'Sepolia',
      signer: address,
      addressIndex: 0,
      maxFee: '100',
      selectedFeeToken: getRandomData(selectedFeeTokens),
      calls: [
        {
          contractAddress: getRandomData(contractAddresses),
          calldata: CallData.compile({
            to: address,
            amount: '1',
          }),
          entrypoint: ContractFuncName.Transfer,
        },
      ],
      includeDeploy: false,
      resourceBounds: {
        l1_gas: {
          max_amount: '0',
          max_price_per_unit: '0',
        },
        l2_gas: {
          max_amount: '0',
          max_price_per_unit: '0',
        },
      },
    });
  }

  return requests;
}

/**
 * Method to generate starkscan transactions.
 *
 * @param params
 * @param params.address - Address of the account.
 * @param params.startFrom - start timestamp of the first transactions.
 * @param params.timestampReduction - the deduction timestamp per transactions.
 * @param params.txnTypes - Array of txn types.
 * @param params.cnt - Number of transaction to generate.
 * @returns An array of transaction object.
 */
export function generateStarkScanTransactions({
  address,
  startFrom = Date.now(),
  timestampReduction = 100,
  cnt = 10,
  txnTypes = [TransactionType.DEPLOY_ACCOUNT, TransactionType.INVOKE],
}: {
  address: string;
  startFrom?: number;
  timestampReduction?: number;
  cnt?: number;
  txnTypes?: TransactionType[];
}): StarkScanTransactionsResponse {
  let transactionStartFrom = startFrom;
  const txs: StarkScanTransaction[] = [];
  let totalRecordCnt = txnTypes.includes(TransactionType.DEPLOY_ACCOUNT)
    ? cnt - 1
    : cnt;

  for (let i = 0; i < totalRecordCnt; i++) {
    let newTx = {
      ...invokeTx,
      account_calls: [...invokeTx.account_calls],
    };
    newTx.sender_address = address;
    newTx.account_calls[0].caller_address = address;
    newTx.timestamp = transactionStartFrom;
    newTx.transaction_hash = validateAndParseAddress(
      `0x${transactionStartFrom.toString(16)}`,
    );
    transactionStartFrom -= timestampReduction;
    txs.push(newTx as unknown as StarkScanTransaction);
  }

  if (txnTypes.includes(TransactionType.DEPLOY_ACCOUNT)) {
    let deployTx = {
      ...cairo0DeployTx,
      account_calls: [...cairo0DeployTx.account_calls],
    };
    deployTx.contract_address = address;
    deployTx.transaction_hash = validateAndParseAddress(
      `0x${transactionStartFrom.toString(16)}`,
    );
    txs.push(deployTx as unknown as StarkScanTransaction);
  }

  return {
    next_url: null,
    data: txs,
  };
}

/**
 * Method to generate a mock estimate fee response.
 *
 * @returns An array containing a mock EstimateFee object.
 */
export function generateEstimateFeesResponse() {
  return [
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      overall_fee: BigInt(1500000000000000).toString(10),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_consumed: BigInt('0x0'),
      suggestedMaxFee: BigInt(1500000000000000).toString(10),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_price: BigInt('0x0'),
      resourceBounds: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        l1_gas: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_amount: '0',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_price_per_unit: '0',
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        l2_gas: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_amount: '0',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          max_price_per_unit: '0',
        },
      },
    } as unknown as EstimateFee,
  ];
}

/**
 * Method to generate a mock input event.
 *
 * @param params - The parameter for generate the mock input event.
 * @param params.transactionRequest - The transaction request object.
 * @param [params.eventValue] - The value of the event.
 * @param [params.eventType] - The type of the event.
 * @param [params.eventName] - The name of the event.
 * @returns An array containing a mock input event object.
 */
export function generateInputEvent({
  transactionRequest,
  eventValue = FeeToken.ETH,
  eventType = UserInputEventType.InputChangeEvent,
  eventName = 'feeTokenSelector',
}: {
  transactionRequest: TransactionRequest;
  eventValue?: string;
  eventType?: UserInputEventType;
  eventName?: string;
}) {
  return {
    event: {
      name: eventName,
      type: eventType,
      value: eventValue,
    } as unknown as UserInputEvent,
    context: {
      request: transactionRequest,
    },
  };
}
