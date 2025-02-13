import { JsonBIP44CoinTypeNode } from '@metamask/key-tree';
import { EstimateFee, GetTransactionResponse, constants, num } from 'starknet';
import {
  AccContract,
  Erc20Token,
  Network,
  Transaction,
  VoyagerTransactionType,
  ExecutionStatus,
  FinailityStatus,
} from '../src/types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../src/utils/constants';

export const invalidNetwork: Network = {
  name: 'Network with emot',
  chainId: '0x12345',
  baseUrl: '',
  nodeUrl: '',
  voyagerUrl: '',
  accountClassHash: '',
};

export const account1: AccContract = {
  address: '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
  addressSalt:
    '0x0154c7b20442ee954f50831702ca844ec185ad484c21719575d351583deec90b',
  addressIndex: 0,
  derivationPath: "m / bip32:44' / bip32:9004' / bip32:0' / bip32:0",
  deployTxnHash:
    '0x5da2d94a324bc56f80cf1fb985c22c85769db434ed403ae71774a07103d229b',
  publicKey:
    '0x154c7b20442ee954f50831702ca844ec185ad484c21719575d351583deec90b',
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
};

export const account2: AccContract = {
  address: '0x0353c982282cb6dea5afc3db185910d6967c1dac6b813bcc6981e6438ea290dd',
  addressSalt:
    '0x019e59f349e1aa813ab4556c5836d0472e5e1ae82d1e5c3b3e8aabfeb290befd',
  addressIndex: 1,
  derivationPath: "m / bip32:44' / bip32:9004' / bip32:0' / bip32:0",
  deployTxnHash:
    '0x5bc00132b8f2fc0f673dc232594b26727e712b204a2716f9dc28a8c5f607b5e',
  publicKey:
    '0x19e59f349e1aa813ab4556c5836d0472e5e1ae82d1e5c3b3e8aabfeb290befd',
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
};

export const account3: AccContract = {
  address: '0x0128a26755280f0bf9bb3a3fc4948ee54e00142761eeef8c5cea5890ad49a96b',
  addressSalt:
    '0x0797efd8e3971dfca4f928485860896201320ce2997ca4789d9343204219599d',
  addressIndex: 2,
  derivationPath: "m / bip32:44' / bip32:9004' / bip32:0' / bip32:0",
  deployTxnHash: '',
  publicKey:
    '0x0797efd8e3971dfca4f928485860896201320ce2997ca4789d9343204219599d',
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
};

export const account4: AccContract = {
  address: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  addressSalt:
    '0x0110e50179b0ef539fd1558571698a98cfe90d6829ff8203bfe577fdda6fc44e',
  addressIndex: 3,
  derivationPath: "m / bip32:44' / bip32:9004' / bip32:0' / bip32:0",
  deployTxnHash:
    '0x3b690b4c9dd639881a46f6a344ee90254562175ed7a7f5a028f69b8c32ccb47',
  publicKey: '',
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
};

export const Cairo1Account1: AccContract = {
  address: '0x0404d766fd6db2c23177e5ea289af99e81e5c4a7badae588950ad0f8572c49b9',
  addressSalt:
    '0x019e59f349e1aa813ab4556c5836d0472e5e1ae82d1e5c3b3e8aabfeb290befd',
  addressIndex: 1,
  derivationPath: "m / bip32:44' / bip32:9004' / bip32:0' / bip32:0",
  deployTxnHash:
    '0x5bc00132b8f2fc0f673dc232594b26727e712b204a2716f9dc28a8c5f607b5e',
  publicKey:
    '0x019e59f349e1aa813ab4556c5836d0472e5e1ae82d1e5c3b3e8aabfeb290befd',
  chainId: constants.StarknetChainId.SN_SEPOLIA,
};

export const token0: Erc20Token = {
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
};
export const token1: Erc20Token = {
  address: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
  name: 'Starknet ERC-20 sample',
  symbol: 'SNET',
  decimals: 18,
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
};

export const token2: Erc20Token = {
  address: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  name: 'ArgentX Test Token',
  symbol: 'TT',
  decimals: 18,
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
};

export const token3: Erc20Token = {
  address: '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
  name: 'Test Token with 10 decimal places',
  symbol: 'TT',
  decimals: 10,
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
};

export const signature1 =
  '3044022001bbc0696d02f85696608c9029973d7d5cf714be2a8188424578c40016262fff022004e388edeb3ceb1fd023b165c9a91cc39b97d58f77beb53b6b90ee9261d9f90c';
export const signature2 =
  '30440220052956ac852275b6004c4e8042450f6dce83059f068029b037cc47338c80d062022002bc0e712f03e341bb3532fc356b779d84fcb4dbfe8ed34de2db66e121971d92';

export const signature4Cairo1SignMessage = [
  '1011319195017091294626264310379704228916787561535736421454347559326036897966',
  '953080452563745534645084375499931001089185216376442413556466035688849743177',
];
export const signature4SignMessage = [
  '784041227270069705374122994163964526105670242785431143890307285886848872447',
  '2211270729821731368290303126976610283184761443640531855459727543936510195980',
];
export const signature4SignMessageWithUnfoundAddress = [
  '1011319195017091294626264310379704228916787561535736421454347559326036897966',
  '953080452563745534645084375499931001089185216376442413556466035688849743177',
];

export const signature3 = [
  '1256731126561482761572869006981488976832873819808625500210956924080068064716',
  '1621003388569060642997584706464972362757030330535363446245801982840065859049',
];
// Derived from seed phrase: "dog simple gown ankle release anger local pulp rose river approve miracle"
export const bip44Entropy: JsonBIP44CoinTypeNode = {
  depth: 2,
  parentFingerprint: 990240287,
  index: 2147492652,
  privateKey:
    '364d2137a06febb7c6ba3967fdd08be2ebdf0421db2f971974a275b219e6ca6f',
  publicKey:
    '04aad806b741287863624bc5eac036e7af4320b611e30407b93010b92ab552c7dc99e40bd45c73f92c93ad496e9bb39fd1bbdf7a1725f375cb275bfea47e42898b',
  chainCode: '32d548120f75e09e1e2affddd66f4747b6bc6b51590af473739039ae0da81738',
  coin_type: 9004,
  path: "m / bip32:44' / bip32:9004'",
};

export const getBip44EntropyStub = async (...args: unknown[]) => {
  if (args?.[0]?.['coinType'] === 9004) {
    return bip44Entropy;
  } else {
    return null;
  }
};

export const createAccountProxyMainnetResp = {
  transaction_hash:
    '0x3b690b4c9dd639881a46f6a344ee90254562175ed7a7f5a028f69b8c32ccb47',
  contract_address:
    '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
};

export const createAccountProxyMainnetResp2 = {
  transaction_hash:
    '0x60d85f7411349c0b4bc94cf1a6659dccb945f82865592ae7aaa494fa62b6965',
  contract_address:
    '0x0353c982282cb6dea5afc3db185910d6967c1dac6b813bcc6981e6438ea290dd',
};

export const createAccountProxyResp = {
  transaction_hash:
    '0x3b690b4c9dd639881a46f6a344ee90254562175ed7a7f5a028f69b8c32ccb47',
  contract_address:
    '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
};

export const createAccountFailedProxyResp = {
  transaction_hash: '',
  contract_address: '',
};

export const initAccountResp = {
  transaction_hash:
    '0x2a8c2d5d4908a6561de87ecb18a76305c64800e3f81b393b9988de1abd37284',
};

export const sendTransactionResp = {
  transaction_hash:
    '0x18f028a699a8811bf64d3c89a770a43f99450b7191dd4e8b22e62b408bf05d0',
};

export const sendTransactionFailedResp = {
  transaction_hash: '',
};

export const getTxnStatusResp = {
  executionStatus: ExecutionStatus.SUCCEEDED,
  finalityStatus: FinailityStatus.ACCEPTED_ON_L1,
};

export const getTxnStatusAcceptL2Resp = {
  executionStatus: ExecutionStatus.SUCCEEDED,
  finalityStatus: FinailityStatus.ACCEPTED_ON_L2,
};

export const createAccountProxyTxn: Transaction = {
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
  contractAddress: createAccountProxyResp.contract_address,
  contractCallData: [],
  contractFuncName: '',
  senderAddress: createAccountProxyResp.contract_address,
  timestamp: 1653559059,
  txnHash: createAccountProxyResp.transaction_hash,
  txnType: VoyagerTransactionType.DEPLOY,
  failureReason: '',
  status: '',
  eventIds: [],
};

export const createAccountProxyTxnOnSepolia: Transaction = {
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
  contractAddress: createAccountProxyResp.contract_address,
  contractCallData: [],
  contractFuncName: '',
  senderAddress: createAccountProxyResp.contract_address,
  timestamp: 1653559059,
  txnHash: createAccountProxyResp.transaction_hash,
  txnType: VoyagerTransactionType.DEPLOY,
  failureReason: '',
  status: '',
  eventIds: [],
};

export const initAccountTxn: Transaction = {
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
  contractAddress: account1.address,
  contractCallData: [], //[account1.publicKey, num.toHex(constants.ZERO)],
  contractFuncName: '', //'initialize',
  senderAddress: account1.address,
  timestamp: 1653559059,
  txnHash: initAccountResp.transaction_hash,
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: '',
  eventIds: [],
};

export const RejectedTxn: Transaction = {
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
  contractAddress: account1.address,
  contractCallData: [], //[account1.publicKey, num.toHex(constants.ZERO)],
  contractFuncName: '', //'initialize',
  senderAddress: account1.address,
  timestamp: 1653559059,
  txnHash: initAccountResp.transaction_hash,
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: 'REJECTED',
  eventIds: [],
};

export const RejectedTxn2: Transaction = {
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
  contractAddress: account1.address,
  contractCallData: [], //[account1.publicKey, num.toHex(constants.ZERO)],
  contractFuncName: '', //'initialize',
  senderAddress: account1.address,
  timestamp: 1653559059,
  txnHash: initAccountResp.transaction_hash,
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: '',
  executionStatus: ExecutionStatus.REJECTED,
  finalityStatus: FinailityStatus.ACCEPTED_ON_L1,
  eventIds: [],
};

export const unsettedTransactionInMassagedTxn: Transaction = {
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
  contractAddress:
    '0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  contractCallData: [
    '0x1',
    '0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
    '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
    '0x0',
    '0x3',
    '0x3',
    '0x14361d05e560796ad3152e083b609f5205f3bd76039327326746ba7f769a666',
    '0xde0b6b3a7640000',
    '0x0',
    '0x1',
  ],
  contractFuncName: 'transfer',
  senderAddress:
    '0x5a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  timestamp: 1655109666,
  txnHash: '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: 'RECEIVED',
  executionStatus: 'RECEIVED',
  finalityStatus: 'RECEIVED',
  eventIds: [],
};

export const txn1: Transaction = {
  chainId: STARKNET_MAINNET_NETWORK.chainId,
  contractAddress:
    '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
  contractCallData: [
    '0x7ec3edbb88ce9d4d1ed62ccee34cf46a405bd15be0409ac9a23ffc1f36e190c',
    '10000000000000000000',
    '0',
  ],
  contractFuncName: 'transfer',
  senderAddress:
    '0x6f60fca373d9e1e8ea878e5d5add68ef7cb52b5d1f0a8e825e72fcf9811e139',
  timestamp: 1653553083,
  txnHash: '0x2268f8830bbac4302e73452c808f9fb70bf9a0d9edae83a001a05b2b45bd67b',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: '',
  eventIds: [],
};

export const txn2: Transaction = {
  chainId: STARKNET_MAINNET_NETWORK.chainId,
  contractAddress:
    '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
  contractCallData: [
    '0x6f60fca373d9e1e8ea878e5d5add68ef7cb52b5d1f0a8e825e72fcf9811e139',
    '5000000000000000000',
    '0',
  ],
  contractFuncName: 'transfer',
  senderAddress:
    '0x7ec3edbb88ce9d4d1ed62ccee34cf46a405bd15be0409ac9a23ffc1f36e190c',
  timestamp: 1653380283,
  txnHash: '0x713a21b8b1e626e586609708db5a4c7ff56017ef77f2b93386421177d1e2bd3',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: '',
  eventIds: [],
};

export const txn3: Transaction = {
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
  contractAddress:
    '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  contractCallData: [
    '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75',
    '1000000000000000000',
    '0',
  ],
  contractFuncName: 'transfer',
  senderAddress:
    '0x6f60fca373d9e1e8ea878e5d5add68ef7cb52b5d1f0a8e825e72fcf9811e139',
  timestamp: 1653559059,
  txnHash: '0x66686eb0781eb55ca873939e8cdb1adf62d5d0b547ae81df79cc8bb06b09e50',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: '',
  eventIds: [],
};

export const txn4: Transaction = {
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
  contractAddress:
    '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  contractCallData: [
    '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75',
    '2000000000000000000',
    '0',
  ],
  contractFuncName: 'transfer',
  senderAddress:
    '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  timestamp: 1653569059,
  txnHash: '0x45ff16a2fd6b489d2e17673addba34af372907b0b23ff9068a23afa49c6138b',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: 'PENDING',
  eventIds: [],
};

export const txn5: Transaction = {
  chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
  contractAddress:
    '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  contractCallData: [
    '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75',
    '2000000000000000000',
    '0',
  ],
  contractFuncName: 'transfer',
  senderAddress:
    '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  timestamp: 1653569160,
  txnHash: '0x75ff16a2fd6b489d2e17673addba34af372907b0b23ff9068a23afa49c61999',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: 'PENDING',
  eventIds: [],
};

export const mainnetTxn1: Transaction = {
  chainId: STARKNET_MAINNET_NETWORK.chainId,
  contractAddress:
    '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  contractCallData: [
    '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75',
    '2000000000000000000',
    '0',
  ],
  contractFuncName: 'transfer',
  senderAddress:
    '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  timestamp: 1653569160,
  txnHash: '0x75ff16a2fd6b489d2e17673addba34af372907b0b23ff9068a23afa49c61999',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: 'PENDING',
  eventIds: [],
};

export const getBalanceResp = ['0x0', '0x0'];

export const estimateDeployFeeResp = {
  overall_fee: num.toBigInt('0x0'),
  gas_consumed: num.toBigInt('0x0'),
  suggestedMaxFee: num.toBigInt('0x0'),
  gas_price: num.toBigInt('0x0'),
} as EstimateFee;

export const estimateDeployFeeResp2 = {
  overall_fee: num.toBigInt('0xaff3f0a7'),
  gas_consumed: num.toBigInt('0x18e1'),
  suggestedMaxFee: num.toBigInt('0x0107ede8fa'),
  gas_price: num.toBigInt('0x071287'),
} as EstimateFee;

export const estimateDeployFeeResp3 = {
  overall_fee: num.toBigInt('0x1160f77b2edd'),
  gas_consumed: num.toBigInt('0x18e1'),
  suggestedMaxFee: num.toBigInt('0x1a117338c64b'),
  gas_price: num.toBigInt('0xb2d3297d'),
} as EstimateFee;

export const estimateDeployFeeResp4 = {
  overall_fee: num.toBigInt('0x1160f77b2edd'),
  suggestedMaxFee: num.toBigInt('0x1a117338c64b'),
} as EstimateFee;

export const estimateFeeResp = {
  overall_fee: num.toBigInt('0x0dc3e44d89e6'),
  suggestedMaxFee: num.toBigInt('0x14a5d6744ed9'),
} as EstimateFee;

export const estimateFeeResp2 = {
  overall_fee: num.toBigInt('0x0dc3e44d89e6'),
  suggestedMaxFee: num.toBigInt('0x14a5d6744ed9'),
} as EstimateFee;

export const unfoundUserAddress =
  '0x0404d766fd6db2c23177e5ea289af99e81e5c4a7badae588950ad0f8572c49b9';
export const unfoundUserPrivateKey =
  '0x38d36fc25592257d913d143d37e12533dba9f6721db6fa954ed513b0dc3d68b';
export const unfoundUserPublicKey =
  '0x154c7b20442ee954f50831702ca844ec185ad484c21719575d351583deec90b';
export const foundUserPrivateKey =
  '0x3cddbb7f3694ce84bd9598820834015d979d78e63474a5b00e59b41b0563f4e';

export const testnetPublicKeys = [
  '0x154c7b20442ee954f50831702ca844ec185ad484c21719575d351583deec90b',
  '0x19e59f349e1aa813ab4556c5836d0472e5e1ae82d1e5c3b3e8aabfeb290befd',
  '0x4b36a2b0a1e9d2af3416914798de776e37d9e0ab9a50d2dec30485dca64bb8',
  '0x6de8036537a36bcdfaf0954f71fd7bb11f3f1a9e5778ac5e988e5f8f56aade4',
  '0x24cf3571b72b7cc235bff8d0e973faccde2c7162e5a3e978d91a529657d718f',
  '0x4863e0b7d7df4a53c5b0b99aef944245856f09cef8f04380ae41dc56ff4ae75',
  '0x282427b86ee5228538ed7d0e0081553cd37a377cd06983c24c0d34acfd35b1a',
  '0x3c23c5416c73af04f89ecb1e19a7074519bb7ef0c6c52a785a2200ff899a916',
  '0x20bc19e11620253377cc18a8b6b633bb964a6488f5941a8d5ad7e97e0b8a6c4',
  '0x4cc995ff1e5a4b145f07912cf9fd5b0a178b23563d4cbf1a4547c43351fc426',
];

export const testnetAccAddresses = [
  '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
  '0x0353c982282cb6dea5afc3db185910d6967c1dac6b813bcc6981e6438ea290dd',
  '0x018dfa1955a0154524203f81c5668d6a78c708375ee8908dcb55a49c6ec87190',
  '0x012f772099692e75ed792aaa4a61cd5cf3dfe9833931aa67296d208bb609312e',
  '0x0541299104160a88ce08b8f1d5d3f8fe565214c5d2651034842e0b596f730a46',
  '0x2d8cdaf0d5de527fb48fa64e8c4a29b7bc1131d30a6e4350fcd960d376a65c0',
  '0x419eebcde2675d0716faf85992a815f64bb05a3b02a5c3805fa9908ad032434',
  '0x1320d99ed97884f476cfa0899d24892eb829f0f69ae1972df3c9516fd7795ec',
  '0x78318094673e259a53912054837b15993f16a04a50bd5af5683cca69196a704',
  '0x75ba974e17b0d1736a7fb81655082e9960c6975edcc1b573d37386cbaf2c0b8',
];

export const mainnetPublicKeys = [
  '0x154c7b20442ee954f50831702ca844ec185ad484c21719575d351583deec90b',
  '0x19e59f349e1aa813ab4556c5836d0472e5e1ae82d1e5c3b3e8aabfeb290befd',
  '0x4b36a2b0a1e9d2af3416914798de776e37d9e0ab9a50d2dec30485dca64bb8',
  '0x6de8036537a36bcdfaf0954f71fd7bb11f3f1a9e5778ac5e988e5f8f56aade4',
  '0x24cf3571b72b7cc235bff8d0e973faccde2c7162e5a3e978d91a529657d718f',
  '0x4863e0b7d7df4a53c5b0b99aef944245856f09cef8f04380ae41dc56ff4ae75',
  '0x282427b86ee5228538ed7d0e0081553cd37a377cd06983c24c0d34acfd35b1a',
  '0x3c23c5416c73af04f89ecb1e19a7074519bb7ef0c6c52a785a2200ff899a916',
  '0x20bc19e11620253377cc18a8b6b633bb964a6488f5941a8d5ad7e97e0b8a6c4',
  '0x4cc995ff1e5a4b145f07912cf9fd5b0a178b23563d4cbf1a4547c43351fc426',
];

export const mainnetAccAddresses = [
  '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
  '0x0353c982282cb6dea5afc3db185910d6967c1dac6b813bcc6981e6438ea290dd',
  '0x018dfa1955a0154524203f81c5668d6a78c708375ee8908dcb55a49c6ec87190',
  '0x012f772099692e75ed792aaa4a61cd5cf3dfe9833931aa67296d208bb609312e',
  '0x0541299104160a88ce08b8f1d5d3f8fe565214c5d2651034842e0b596f730a46',
  '0x2d8cdaf0d5de527fb48fa64e8c4a29b7bc1131d30a6e4350fcd960d376a65c0',
  '0x419eebcde2675d0716faf85992a815f64bb05a3b02a5c3805fa9908ad032434',
  '0x1320d99ed97884f476cfa0899d24892eb829f0f69ae1972df3c9516fd7795ec',
  '0x78318094673e259a53912054837b15993f16a04a50bd5af5683cca69196a704',
  '0x75ba974e17b0d1736a7fb81655082e9960c6975edcc1b573d37386cbaf2c0b8',
];

export const getTxnsFromVoyagerResp = {
  items: [
    {
      blockId:
        '0x2c6b3d318f93b500b44dcf565f65dda066f22cae6f4d76e3ec479193d77a511',
      hash: '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
      index: 13,
      l1VerificationHash:
        '0x8ac5cbcb6d450c74bfd90cef3cd8317046cf45c42c7eaaf3f50d7f6d8f4e6674',
      type: 'invoke',
      contract_address:
        '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
      timestamp: 1655109666,
      entry_point_type: null,
      signature: [
        '0xc592f24ab0e90ea4dac92a1e18aabec8033ebd3ce3a517cdc72972ade3e121',
        '0x1bca4a8c65bf5aa28fcf0deb63307389e6d0f4f3295561f90a79b5313d08fc6',
      ],
      actual_fee: null,
      status: 'Accepted on L1',
      class_hash: null,
      sender_address: null,
    },
    {
      blockId:
        '0x78ba7300924ababbe80d05b9f36e9f0a3f40b6889d16662513aa7001aa7d2e5',
      hash: '0x6beceb86579dc78749bdaaf441501edc21e218e020236e2ebea1b6a96d0bac7',
      index: 6,
      l1VerificationHash:
        '0x541407978cf4a091167c97b9141d34261329b48423631218dc644fecaa94f176',
      type: 'deploy',
      contract_address:
        '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
      timestamp: 1654834401,
      entry_point_type: null,
      signature: null,
      actual_fee: '0x0',
      status: 'Accepted on L1',
      class_hash: null,
      sender_address: null,
    },
  ],
  lastPage: 1,
};

export const getTxnFromVoyagerResp1 = {
  header: {
    blockId:
      '0x2c6b3d318f93b500b44dcf565f65dda066f22cae6f4d76e3ec479193d77a511',
    blockNumber: 238254,
    hash: '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
    index: 13,
    l1VerificationHash:
      '0x8ac5cbcb6d450c74bfd90cef3cd8317046cf45c42c7eaaf3f50d7f6d8f4e6674',
    type: 'invoke',
    contract_address:
      '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
    timestamp: 1655109666,
    entry_point_type: null,
    signature: [
      '0xc592f24ab0e90ea4dac92a1e18aabec8033ebd3ce3a517cdc72972ade3e121',
      '0x1bca4a8c65bf5aa28fcf0deb63307389e6d0f4f3295561f90a79b5313d08fc6',
    ],
    status: 'Accepted on L1',
    sender_address: null,
    version: null,
    nonce: null,
    class_hash: null,
  },
  calldata: [
    '0x1',
    '0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
    '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
    '0x0',
    '0x3',
    '0x3',
    '0x14361d05e560796ad3152e083b609f5205f3bd76039327326746ba7f769a666',
    '0xde0b6b3a7640000',
    '0x0',
    '0x1',
  ],
  selector: '0x15d40a3d6ca2ac30f4031e42be28da9b056fef9bb7357ac5e85627ee876e5ad',
  maxFee: '0x14c51dc08cad',
  actualFee: null,
  argentxMetadata: {
    calldata: [
      {
        name: 'address[1]',
        value:
          '0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      },
      {
        name: 'selector[1]',
        value:
          '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
      },
      {
        name: 'recipient[1]',
        value:
          '0x14361d05e560796ad3152e083b609f5205f3bd76039327326746ba7f769a666',
      },
      {
        name: 'amount[1]',
        value: '0x0de0b6b3a7640000',
      },
      {
        name: 'nonce',
        value: '0x1',
      },
    ],
    functionNames: ['transfer'],
  },
  nonce: '0x1',
  receipt: {
    events: [
      {
        block_number: 238254,
        transaction_number: 13,
        number: 0,
        from_address:
          '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
        data: [
          '548469262577982069419604814212071324757767447805833156581774446435100180985',
          '1',
          '1',
        ],
        keys: [
          '160509384506897785609912026407502909755389202887426828748018058577681165651',
        ],
        transactionHash:
          '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
        blockHash:
          '0x2c6b3d318f93b500b44dcf565f65dda066f22cae6f4d76e3ec479193d77a511',
        id: '238254_13_0',
      },
    ],
  },
};

export const getTxnFromVoyagerResp2 = {
  header: {
    blockId:
      '0x78ba7300924ababbe80d05b9f36e9f0a3f40b6889d16662513aa7001aa7d2e5',
    blockNumber: 235032,
    hash: '0x6beceb86579dc78749bdaaf441501edc21e218e020236e2ebea1b6a96d0bac7',
    index: 6,
    l1VerificationHash:
      '0x541407978cf4a091167c97b9141d34261329b48423631218dc644fecaa94f176',
    type: 'deploy',
    contract_address:
      '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
    timestamp: 1654834401,
    entry_point_type: null,
    signature: null,
    status: 'Accepted on L1',
    sender_address: null,
    version: null,
    nonce: null,
    class_hash: null,
  },
  calldata: null,
  selector: null,
  maxFee: null,
  actualFee: '0x0',
  argentxMetadata: {
    calldata: [],
    functionNames: [],
  },
  nonce: null,
  receipt: {
    events: [
      {
        block_number: 235032,
        transaction_number: 6,
        number: 0,
        from_address:
          '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
        data: [
          '2561146817694037944268364036216184626484657582211188385622551558011813041058',
          '482162941308656319432912742303005906397762181614840110745460294213899895886',
          '0',
        ],
        keys: [
          '473692704853087324234226353339653488579626936186557422111458551781472692100',
        ],
        transactionHash:
          '0x6beceb86579dc78749bdaaf441501edc21e218e020236e2ebea1b6a96d0bac7',
        blockHash:
          '0x78ba7300924ababbe80d05b9f36e9f0a3f40b6889d16662513aa7001aa7d2e5',
        id: '235032_6_0',
      },
    ],
  },
};

export const getTxnFromSequencerResp1 = {
  status: 'ACCEPTED_ON_L1',
  block_hash:
    '0x2c6b3d318f93b500b44dcf565f65dda066f22cae6f4d76e3ec479193d77a511',
  block_number: 238254,
  transaction_index: 13,
  transaction: {
    transaction_hash:
      '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
    version: '0x0',
    max_fee: '0x14c51dc08cad',
    signature: [
      '0xc592f24ab0e90ea4dac92a1e18aabec8033ebd3ce3a517cdc72972ade3e121',
      '0x1bca4a8c65bf5aa28fcf0deb63307389e6d0f4f3295561f90a79b5313d08fc6',
    ],
    contract_address:
      '0x5a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
    entry_point_selector:
      '0x15d40a3d6ca2ac30f4031e42be28da9b056fef9bb7357ac5e85627ee876e5ad',
    calldata: [
      '0x1',
      '0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
      '0x0',
      '0x3',
      '0x3',
      '0x14361d05e560796ad3152e083b609f5205f3bd76039327326746ba7f769a666',
      '0xde0b6b3a7640000',
      '0x0',
      '0x1',
    ],
    type: 'INVOKE_FUNCTION',
  },
  calldata: [
    '0x1',
    '0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
    '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
    '0x0',
    '0x3',
    '0x3',
    '0x14361d05e560796ad3152e083b609f5205f3bd76039327326746ba7f769a666',
    '0xde0b6b3a7640000',
    '0x0',
    '0x1',
  ],
  contract_address:
    '0x5a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  entry_point_selector:
    '0x15d40a3d6ca2ac30f4031e42be28da9b056fef9bb7357ac5e85627ee876e5ad',
  max_fee: '0x14c51dc08cad',
  signature: [
    '0xc592f24ab0e90ea4dac92a1e18aabec8033ebd3ce3a517cdc72972ade3e121',
    '0x1bca4a8c65bf5aa28fcf0deb63307389e6d0f4f3295561f90a79b5313d08fc6',
  ],
  transaction_hash:
    '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
  version: '0x0',
} as unknown as GetTransactionResponse;

export const getTxnFromSequencerResp2 = {
  status: 'ACCEPTED_ON_L1',
  block_hash:
    '0x78ba7300924ababbe80d05b9f36e9f0a3f40b6889d16662513aa7001aa7d2e5',
  block_number: 235032,
  transaction_index: 6,
  transaction: {
    transaction_hash:
      '0x6beceb86579dc78749bdaaf441501edc21e218e020236e2ebea1b6a96d0bac7',
    version: '0x0',
    contract_address:
      '0x5a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
    contract_address_salt:
      '0x110e50179b0ef539fd1558571698a98cfe90d6829ff8203bfe577fdda6fc44e',
    class_hash:
      '0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
    constructor_calldata: [
      '0x3e327de1c40540b98d05cbcb13552008e36f0ec8d61d46956d2f9752c294328',
      '0x79dc0da7c54b95f10aa182ad0a46400db63156920adb65eca2654c0945a463',
      '0x2',
      '0x110e50179b0ef539fd1558571698a98cfe90d6829ff8203bfe577fdda6fc44e',
      '0x0',
    ],
    type: 'DEPLOY',
  },
  calldata: [],
  contract_address:
    '0x5a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  transaction_hash:
    '0x6beceb86579dc78749bdaaf441501edc21e218e020236e2ebea1b6a96d0bac7',
  version: '0x0',
} as unknown as GetTransactionResponse;

export const expectedMassagedTxn4: Transaction = {
  chainId: '0x534e5f5345504f4c4941',
  contractAddress:
    '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  contractCallData: [
    '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75',
    '2000000000000000000',
    '0',
  ],
  contractFuncName: 'transfer',
  eventIds: [],
  failureReason: '',
  senderAddress:
    '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  status: '',
  finalityStatus: 'ACCEPTED_ON_L2',
  executionStatus: 'SUCCEEDED',
  timestamp: 1653569059,
  txnHash: '0x45ff16a2fd6b489d2e17673addba34af372907b0b23ff9068a23afa49c6138b',
  txnType: 'invoke',
};

export const expectedMassagedTxn5: Transaction = {
  chainId: '0x534e5f5345504f4c4941',
  contractAddress:
    '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  contractCallData: [
    '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75',
    '2000000000000000000',
    '0',
  ],
  contractFuncName: 'transfer',
  eventIds: [],
  failureReason: '',
  senderAddress:
    '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  status: 'PENDING',
  finalityStatus: undefined,
  executionStatus: undefined,
  timestamp: 1653569160,
  txnHash: '0x75ff16a2fd6b489d2e17673addba34af372907b0b23ff9068a23afa49c61999',
  txnType: 'invoke',
};

export const expectedMassagedTxns: Transaction[] = [
  {
    txnHash:
      '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
    txnType: 'invoke',
    chainId: '0x534e5f5345504f4c4941',
    senderAddress:
      '0x5a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
    contractAddress:
      '0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
    contractFuncName: 'transfer',
    contractCallData: [
      '0x1',
      '0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
      '0x0',
      '0x3',
      '0x3',
      '0x14361d05e560796ad3152e083b609f5205f3bd76039327326746ba7f769a666',
      '0xde0b6b3a7640000',
      '0x0',
      '0x1',
    ],
    timestamp: 1655109666,
    status: '',
    finalityStatus: 'ACCEPTED_ON_L1',
    executionStatus: 'SUCCEEDED',
    eventIds: [],
    failureReason: '',
  },
  {
    txnHash:
      '0x6beceb86579dc78749bdaaf441501edc21e218e020236e2ebea1b6a96d0bac7',
    txnType: 'deploy',
    chainId: '0x534e5f5345504f4c4941',
    senderAddress:
      '0x5a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
    contractAddress:
      '0x5a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
    contractFuncName: '',
    contractCallData: [],
    timestamp: 1654834401,
    status: '',
    finalityStatus: 'ACCEPTED_ON_L1',
    executionStatus: 'SUCCEEDED',
    eventIds: [],
    failureReason: '',
  },
  expectedMassagedTxn5,
  expectedMassagedTxn4,
];
