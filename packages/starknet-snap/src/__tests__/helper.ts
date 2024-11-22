import {
  BIP44CoinTypeNode,
  getBIP44AddressKeyDeriver,
} from '@metamask/key-tree';
import { generateMnemonic } from 'bip39';
import { getRandomValues } from 'crypto';
import type { constants, EstimateFee } from 'starknet';
import {
  ec,
  CallData,
  hash,
  type Calldata,
  num as numUtils,
  TransactionFinalityStatus,
  TransactionExecutionStatus,
  TransactionType,
} from 'starknet';
import { v4 as uuidv4 } from 'uuid';

import type {
  AccContract,
  Transaction,
  TransactionRequest,
} from '../types/snapState';
import {
  ACCOUNT_CLASS_HASH,
  ACCOUNT_CLASS_HASH_LEGACY,
  ETHER_MAINNET,
  PRELOADED_TOKENS,
  PROXY_CONTRACT_HASH,
  STRK_MAINNET,
} from '../utils/constants';
import { grindKey } from '../utils/keyPair';

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
 * Method to generate starknet account.
 *
 * @param network - Starknet Chain Id.
 * @param cnt - Number of accounts to generate.
 * @param cairoVersion - Cairo version of the generated accounts.
 * @returns An array of StarknetAccount object.
 */
export async function generateAccounts(
  network: constants.StarknetChainId,
  cnt: number = 1,
  cairoVersion = '1',
  mnemonic?: string,
) {
  const accounts: StarknetAccount[] = [];
  let mnemonicString = mnemonic;
  if (!mnemonicString) {
    mnemonicString = generateMnemonic();
  }

  for (let i = 0; i < cnt; i++) {
    // simulate the bip44 entropy generation
    const node = await generateBip44Entropy(mnemonicString);
    const keyDeriver = await getBIP44AddressKeyDeriver(node);
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

    if (address.length < 66) {
      address = address.replace('0x', `0x${'0'.repeat(66 - address.length)}`);
    }

    accounts.push({
      addressSalt: pubKey,
      privateKey: numUtils.toHex(addressKey),
      publicKey: pubKey,
      address: address,
      addressIndex: i,
      derivationPath: keyDeriver.path,
      deployTxnHash: '',
      chainId: network,
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
 * @returns An array of transaction object.
 */
export function generateTransactions({
  chainId,
  address,
  contractAddresses = PRELOADED_TOKENS.map((token) => token.address),
  txnTypes = Object.values(TransactionType),
  finalityStatuses = Object.values(TransactionFinalityStatus),
  executionStatuses = Object.values(TransactionExecutionStatus),
  // The timestamp from data source is in seconds
  timestamp = Math.floor(Date.now() / 1000),
  cnt = 1,
}: {
  chainId: constants.StarknetChainId;
  address: string;
  contractAddresses?: string[];
  txnTypes?: TransactionType[];
  finalityStatuses?: TransactionFinalityStatus[];
  executionStatuses?: TransactionExecutionStatus[];
  timestamp?: number;
  cnt?: number;
}): Transaction[] {
  const transaction = {
    chainId: chainId,
    contractAddress: '',
    contractCallData: [],
    contractFuncName: '',
    senderAddress: address,
    timestamp: timestamp,
    txnHash: '',
    txnType: '',
    failureReason: '',
    status: '',
    executionStatus: '',
    finalityStatus: '',
    eventIds: [],
  };
  let accumulatedTimestamp = timestamp;
  let accumulatedTxnHash = BigInt(
    '0x2a8c2d5d4908a6561de87ecb18a76305c64800e3f81b393b9988de1abd37284',
  );

  let createCnt = cnt;
  let filteredTxnTypes = txnTypes;
  const transactions: Transaction[] = [];

  // only 1 deploy account transaction to generate
  if (
    txnTypes.includes(TransactionType.DEPLOY_ACCOUNT) ||
    txnTypes.includes(TransactionType.DEPLOY)
  ) {
    transactions.push({
      ...transaction,
      contractAddress: address,
      txnType: TransactionType.DEPLOY_ACCOUNT,
      finalityStatus: TransactionFinalityStatus.ACCEPTED_ON_L1,
      executionStatus: TransactionExecutionStatus.SUCCEEDED,
      timestamp: accumulatedTimestamp,
      txnHash: '0x' + accumulatedTxnHash.toString(16),
    });
    createCnt -= 1;
    // exclude deploy txnType
    filteredTxnTypes = filteredTxnTypes.filter(
      (type) =>
        type !== TransactionType.DEPLOY_ACCOUNT &&
        type !== TransactionType.DEPLOY,
    );
  }

  if (filteredTxnTypes.length === 0) {
    filteredTxnTypes = [TransactionType.INVOKE];
  }

  for (let i = 1; i <= createCnt; i++) {
    const randomContractAddress =
      contractAddresses[
        Math.floor(generateRandomValue() * contractAddresses.length)
      ];
    const randomTxnType =
      filteredTxnTypes[
        Math.floor(generateRandomValue() * filteredTxnTypes.length)
      ];
    let randomFinalityStatus =
      finalityStatuses[
        Math.floor(generateRandomValue() * finalityStatuses.length)
      ];
    let randomExecutionStatus =
      executionStatuses[
        Math.floor(generateRandomValue() * executionStatuses.length)
      ];
    let randomContractFuncName = ['transfer', 'upgrade'][
      Math.floor(generateRandomValue() * 2)
    ];
    accumulatedTimestamp += i * 100;
    accumulatedTxnHash += BigInt(i * 100);

    if (randomExecutionStatus === TransactionExecutionStatus.REJECTED) {
      if (
        [
          TransactionFinalityStatus.NOT_RECEIVED,
          TransactionFinalityStatus.RECEIVED,
          TransactionFinalityStatus.ACCEPTED_ON_L1,
        ].includes(randomFinalityStatus)
      ) {
        randomFinalityStatus = TransactionFinalityStatus.ACCEPTED_ON_L2;
      }
    }

    if (randomFinalityStatus === TransactionFinalityStatus.NOT_RECEIVED) {
      randomFinalityStatus = TransactionFinalityStatus.ACCEPTED_ON_L2;
      randomExecutionStatus = TransactionExecutionStatus.SUCCEEDED;
    }

    transactions.push({
      ...transaction,
      contractAddress: randomContractAddress,
      txnType: randomTxnType,
      finalityStatus: randomFinalityStatus,
      executionStatus: randomExecutionStatus,
      timestamp: accumulatedTimestamp,
      contractFuncName:
        randomTxnType === TransactionType.INVOKE ? randomContractFuncName : '',
      txnHash: '0x' + accumulatedTxnHash.toString(16),
    });
  }

  return transactions.sort((a, b) => b.timestamp - a.timestamp);
}

export function generateTransactionRequests({
  chainId,
  address,
  contractAddresses = PRELOADED_TOKENS.map((token) => token.address),
  cnt = 1,
}: {
  chainId: constants.StarknetChainId;
  address: string;
  contractAddresses?: string[];
  cnt?: number;
}): TransactionRequest[] {
  const feeTokens = [STRK_MAINNET, ETHER_MAINNET];
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
      selectedFeeToken:
        feeTokens[Math.floor(generateRandomValue() * feeTokens.length)].symbol,
      calls: [
        {
          contractAddress:
            contractAddresses[
              Math.floor(generateRandomValue() * contractAddresses.length)
            ],
          calldata: CallData.compile({
            to: address,
            amount: '1',
          }),
          entrypoint: 'transfer',
        },
      ],
      includeDeploy: false,
      resourceBounds: [
        {
          l1_gas: {
            max_amount: '0',
            max_price_per_unit: '0',
          },
          l2_gas: {
            max_amount: '0',
            max_price_per_unit: '0',
          },
        },
      ],
    });
  }

  return requests;
}
/**
 * Method to generate a mock estimate fee response.
 *
 * @returns An array containing a mock EstimateFee object.
 */
export function getEstimateFees() {
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
