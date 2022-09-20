import { JsonBIP44CoinTypeNode } from '@metamask/key-tree';
import { constants, number, Status } from 'starknet';
import { AccContract, Erc20Token, Network, Transaction, VoyagerTransactionType } from '../src/types/snapState';
import { STARKNET_MAINNET_NETWORK, STARKNET_TESTNET_NETWORK } from '../src/utils/constants';

export const invalidNetwork: Network = {
  name: 'Network with emot',
  chainId: '0x12345',
  baseUrl: '',
  nodeUrl: '',
  voyagerUrl: '',
  accountClassHash: '',
};

export const account1: AccContract = {
  address: '0x57c2c9609934e5e2a23ecc5027c65731065d255fd8ce4a7234626b9b35e8e70',
  addressSalt: '0x05d29e4b51193b25475380872f5809db82727557c64910235d63ae26b26a2461',
  addressIndex: 0,
  derivationPath: "m / bip32:44' / bip32:9004' / bip32:0' / bip32:0",
  deployTxnHash: '0x5da2d94a324bc56f80cf1fb985c22c85769db434ed403ae71774a07103d229b',
  publicKey: '0x05d29e4b51193b25475380872f5809db82727557c64910235d63ae26b26a2461',
  chainId: constants.StarknetChainId.TESTNET,
};

export const account2: AccContract = {
  address: '0x7aca804cc7541b6e57f2d7d22284f41ef7b445f4560526a2c6a48398e55cf86',
  addressSalt: '0x06be07eaf385c24bfd6dbc6450b362f6ad3ca83d310ccb3b1896aae92cc355a2',
  addressIndex: 1,
  derivationPath: "m / bip32:44' / bip32:9004' / bip32:0' / bip32:0",
  deployTxnHash: '0x5bc00132b8f2fc0f673dc232594b26727e712b204a2716f9dc28a8c5f607b5e',
  publicKey: '0x06be07eaf385c24bfd6dbc6450b362f6ad3ca83d310ccb3b1896aae92cc355a2',
  chainId: constants.StarknetChainId.TESTNET,
};

export const account3: AccContract = {
  address: '0x128a26755280f0bf9bb3a3fc4948ee54e00142761eeef8c5cea5890ad49a96b',
  addressSalt: '0x0797efd8e3971dfca4f928485860896201320ce2997ca4789d9343204219599d',
  addressIndex: 2,
  derivationPath: "m / bip32:44' / bip32:9004' / bip32:0' / bip32:0",
  deployTxnHash: '',
  publicKey: '0x0797efd8e3971dfca4f928485860896201320ce2997ca4789d9343204219599d',
  chainId: constants.StarknetChainId.TESTNET,
};

export const account4: AccContract = {
  address: '0x5a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  addressSalt: '0x0110e50179b0ef539fd1558571698a98cfe90d6829ff8203bfe577fdda6fc44e',
  addressIndex: 3,
  derivationPath: "m / bip32:44' / bip32:9004' / bip32:0' / bip32:0",
  deployTxnHash: '0x3b690b4c9dd639881a46f6a344ee90254562175ed7a7f5a028f69b8c32ccb47',
  publicKey: '',
  chainId: constants.StarknetChainId.TESTNET,
};

export const token1: Erc20Token = {
  address: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
  name: 'StarkNet ERC-20 sample',
  symbol: 'SNET',
  decimals: 18,
  chainId: constants.StarknetChainId.TESTNET,
};

export const token2: Erc20Token = {
  address: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  name: 'ArgentX Test Token',
  symbol: 'TT',
  decimals: 18,
  chainId: constants.StarknetChainId.TESTNET,
};

export const token3: Erc20Token = {
  address: '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
  name: 'Test Token with 10 decimal places',
  symbol: 'TT',
  decimals: 10,
  chainId: constants.StarknetChainId.TESTNET,
};

export const signature1 = [
  '2121320640460590640541012102648975038969582979202416014111718766642353818340',
  '786244468223897203145061704883349714415393691543700276171926335884401345499',
];

export const signature2 = [
  '509210968929191264109539398328327304776456858314483751496677017554224942535',
  '2490562014257449737955709015513146789604950972547136148574384459590409894467',
];

// Derived from seed phrase: "dog simple gown ankle release anger local pulp rose river approve miracle"
export const bip44Entropy: JsonBIP44CoinTypeNode = {
  depth: 2,
  parentFingerprint: 990240287,
  index: 2147492652,
  privateKey: '364d2137a06febb7c6ba3967fdd08be2ebdf0421db2f971974a275b219e6ca6f',
  publicKey:
    '04aad806b741287863624bc5eac036e7af4320b611e30407b93010b92ab552c7dc99e40bd45c73f92c93ad496e9bb39fd1bbdf7a1725f375cb275bfea47e42898b',
  chainCode: '32d548120f75e09e1e2affddd66f4747b6bc6b51590af473739039ae0da81738',
  coin_type: 9004,
  path: "m / bip32:44' / bip32:9004'",
};

export const createAccountProxyMainnetResp = {
  transaction_hash: '0x3b690b4c9dd639881a46f6a344ee90254562175ed7a7f5a028f69b8c32ccb47',
  contract_address: '0x57c2c9609934e5e2a23ecc5027c65731065d255fd8ce4a7234626b9b35e8e70',
};

export const createAccountProxyMainnetResp2 = {
  transaction_hash: '0x60d85f7411349c0b4bc94cf1a6659dccb945f82865592ae7aaa494fa62b6965',
  contract_address: '0x7aca804cc7541b6e57f2d7d22284f41ef7b445f4560526a2c6a48398e55cf86',
};

export const createAccountProxyResp = {
  transaction_hash: '0x3b690b4c9dd639881a46f6a344ee90254562175ed7a7f5a028f69b8c32ccb47',
  contract_address: '0x0388ef19a9f403d9dbc593487f9b8e64548b25091cef6ce68f8132cc433c7654',
};

export const createAccountFailedProxyResp = {
  transaction_hash: '',
  contract_address: '',
};

export const initAccountResp = {
  transaction_hash: '0x2a8c2d5d4908a6561de87ecb18a76305c64800e3f81b393b9988de1abd37284',
};

export const sendTransactionResp = {
  transaction_hash: '0x18f028a699a8811bf64d3c89a770a43f99450b7191dd4e8b22e62b408bf05d0',
};

export const sendTransactionFailedResp = {
  transaction_hash: '',
};

export const getTxnStatusResp = 'ACCEPTED_ON_L1' as Status;

export const createAccountProxyTxn: Transaction = {
  chainId: STARKNET_TESTNET_NETWORK.chainId,
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
  chainId: STARKNET_TESTNET_NETWORK.chainId,
  contractAddress: account1.address,
  contractCallData: [], //[account1.publicKey, number.toHex(constants.ZERO)],
  contractFuncName: '', //'initialize',
  senderAddress: account1.address,
  timestamp: 1653559059,
  txnHash: initAccountResp.transaction_hash,
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: '',
  eventIds: [],
};

export const txn1: Transaction = {
  chainId: STARKNET_MAINNET_NETWORK.chainId,
  contractAddress: '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
  contractCallData: ['0x7ec3edbb88ce9d4d1ed62ccee34cf46a405bd15be0409ac9a23ffc1f36e190c', '10000000000000000000', '0'],
  contractFuncName: 'transfer',
  senderAddress: '0x6f60fca373d9e1e8ea878e5d5add68ef7cb52b5d1f0a8e825e72fcf9811e139',
  timestamp: 1653553083,
  txnHash: '0x2268f8830bbac4302e73452c808f9fb70bf9a0d9edae83a001a05b2b45bd67b',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: '',
  eventIds: [],
};

export const txn2: Transaction = {
  chainId: STARKNET_MAINNET_NETWORK.chainId,
  contractAddress: '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
  contractCallData: ['0x6f60fca373d9e1e8ea878e5d5add68ef7cb52b5d1f0a8e825e72fcf9811e139', '5000000000000000000', '0'],
  contractFuncName: 'transfer',
  senderAddress: '0x7ec3edbb88ce9d4d1ed62ccee34cf46a405bd15be0409ac9a23ffc1f36e190c',
  timestamp: 1653380283,
  txnHash: '0x713a21b8b1e626e586609708db5a4c7ff56017ef77f2b93386421177d1e2bd3',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: '',
  eventIds: [],
};

export const txn3: Transaction = {
  chainId: STARKNET_TESTNET_NETWORK.chainId,
  contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  contractCallData: ['0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75', '1000000000000000000', '0'],
  contractFuncName: 'transfer',
  senderAddress: '0x6f60fca373d9e1e8ea878e5d5add68ef7cb52b5d1f0a8e825e72fcf9811e139',
  timestamp: 1653559059,
  txnHash: '0x66686eb0781eb55ca873939e8cdb1adf62d5d0b547ae81df79cc8bb06b09e50',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: '',
  eventIds: [],
};

export const txn4: Transaction = {
  chainId: STARKNET_TESTNET_NETWORK.chainId,
  contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  contractCallData: ['0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75', '2000000000000000000', '0'],
  contractFuncName: 'transfer',
  senderAddress: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  timestamp: 1653569059,
  txnHash: '0x45ff16a2fd6b489d2e17673addba34af372907b0b23ff9068a23afa49c6138b',
  txnType: VoyagerTransactionType.INVOKE,
  failureReason: '',
  status: 'PENDING',
  eventIds: [],
};

export const estimateFeeResp = {
  overall_fee: number.toBN('0x0dc3e44d89e6'),
  gas_consumed: number.toBN('0x276a'),
  suggestedMaxFee: number.toBN('0x14a5d6744ed9'),
  gas_price: number.toBN('0x59682f07'),
};

export const estimateFeeResp2 = {
  overall_fee: number.toBN('0x0dc3e44d89e6'),
  suggestedMaxFee: number.toBN('0x14a5d6744ed9'),
};

export const getNonceResp = {
  result: ['0x2'],
};

export const unfoundUserAddress = '0x1018488ad767b06c16f309f419c68356b863bac53ad5cd5ea19f15f33cec0d6';
export const unfoundUserPrivateKey = '0x610d87a5c02459f8643f9ad6a9bc70597d1a8a0ab4d645346b7eadc5266ad4d';
export const unfoundUserPublicKey = '0x0388ef19a9f403d9dbc593487f9b8e64548b25091cef6ce68f8132cc433c7654';
export const foundUserPrivateKey = '0x3cddbb7f3694ce84bd9598820834015d979d78e63474a5b00e59b41b0563f4e';

export const testnetPublicKeys = [
  '0x05d29e4b51193b25475380872f5809db82727557c64910235d63ae26b26a2461',
  '0x06be07eaf385c24bfd6dbc6450b362f6ad3ca83d310ccb3b1896aae92cc355a2',
  '0x0388ef19a9f403d9dbc593487f9b8e64548b25091cef6ce68f8132cc433c7654',
  '0x04e72db9bc95260c9f544d73f6dc1a318c643df6c9b3dc77460d3dc1a4c3cd9b',
  '0x0728fd84a471029506a0d8ef5213bd08aed06552fabcf4a8858d569dcf2ab3e7',
  '0x069d15c92678d75664d83031bd150d5707a51d8c0ee418f88a8d4d92a7c87860',
  '0x0702e6bca52dc5be2aea11c36780b8b8358ea3faf89256ad01980f895868f21a',
  '0x06ff5015cacef06a17bd087694297938cfae1ed3ee256a855ca7a84981bafb8d',
  '0x079066626ce1cb433b12ec1755157e294df6fe4e418aa672365f85f11bb5b5f0',
  '0x0d38c0f976c0e83dbfa8de595d8239623e75da5cfacca7a086c42b2a739e98',
];

export const testnetAccAddresses = [
  '0x57c2c9609934e5e2a23ecc5027c65731065d255fd8ce4a7234626b9b35e8e70',
  '0x7aca804cc7541b6e57f2d7d22284f41ef7b445f4560526a2c6a48398e55cf86',
  '0x1018488ad767b06c16f309f419c68356b863bac53ad5cd5ea19f15f33cec0d6',
  '0x24809bc377447f3dd83cdac92d61c3f9a784f9d3350cf0e5881ed33740fb920',
  '0x109f5733b7f456e3f2ed786136053c9c400f0bd3aa156576aebd2b45f8d430f',
  '0x70f21c66c45d7fcc64c42268b0b067eadc1dc085cdde9e59707e25b5db39423',
  '0x71a2490633a1c3dd6aa0eab5f7c7b89531cbe85a8a7767823be2b103f376de6',
  '0x3ddc18fcb20737f7a228f016367d67ecf480640d50abddbbf2dba6f6694f648',
  '0x1e1c0f162c5e148e2cced1f2a4e3f4b37e898f5be5df53ec7a4149a0f1f67d2',
  '0x287f3bf9dbe2a98039d9cafdd3d82f255f77a990d4662405fce1a9df8f0a898',
];

export const mainnetPublicKeys = [
  '0x05d29e4b51193b25475380872f5809db82727557c64910235d63ae26b26a2461',
  '0x06be07eaf385c24bfd6dbc6450b362f6ad3ca83d310ccb3b1896aae92cc355a2',
  '0x0388ef19a9f403d9dbc593487f9b8e64548b25091cef6ce68f8132cc433c7654',
  '0x04e72db9bc95260c9f544d73f6dc1a318c643df6c9b3dc77460d3dc1a4c3cd9b',
  '0x0728fd84a471029506a0d8ef5213bd08aed06552fabcf4a8858d569dcf2ab3e7',
  '0x069d15c92678d75664d83031bd150d5707a51d8c0ee418f88a8d4d92a7c87860',
  '0x0702e6bca52dc5be2aea11c36780b8b8358ea3faf89256ad01980f895868f21a',
  '0x06ff5015cacef06a17bd087694297938cfae1ed3ee256a855ca7a84981bafb8d',
  '0x079066626ce1cb433b12ec1755157e294df6fe4e418aa672365f85f11bb5b5f0',
  '0x0d38c0f976c0e83dbfa8de595d8239623e75da5cfacca7a086c42b2a739e98',
];

export const mainnetAccAddresses = [
  '0x57c2c9609934e5e2a23ecc5027c65731065d255fd8ce4a7234626b9b35e8e70',
  '0x7aca804cc7541b6e57f2d7d22284f41ef7b445f4560526a2c6a48398e55cf86',
  '0x1018488ad767b06c16f309f419c68356b863bac53ad5cd5ea19f15f33cec0d6',
  '0x24809bc377447f3dd83cdac92d61c3f9a784f9d3350cf0e5881ed33740fb920',
  '0x109f5733b7f456e3f2ed786136053c9c400f0bd3aa156576aebd2b45f8d430f',
  '0x70f21c66c45d7fcc64c42268b0b067eadc1dc085cdde9e59707e25b5db39423',
  '0x71a2490633a1c3dd6aa0eab5f7c7b89531cbe85a8a7767823be2b103f376de6',
  '0x3ddc18fcb20737f7a228f016367d67ecf480640d50abddbbf2dba6f6694f648',
  '0x1e1c0f162c5e148e2cced1f2a4e3f4b37e898f5be5df53ec7a4149a0f1f67d2',
  '0x287f3bf9dbe2a98039d9cafdd3d82f255f77a990d4662405fce1a9df8f0a898',
];

export const getTxnsFromVoyagerResp = {
  items: [
    {
      blockId: '0x2c6b3d318f93b500b44dcf565f65dda066f22cae6f4d76e3ec479193d77a511',
      hash: '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
      index: 13,
      l1VerificationHash: '0x8ac5cbcb6d450c74bfd90cef3cd8317046cf45c42c7eaaf3f50d7f6d8f4e6674',
      type: 'invoke',
      to: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
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
      blockId: '0x78ba7300924ababbe80d05b9f36e9f0a3f40b6889d16662513aa7001aa7d2e5',
      hash: '0x6beceb86579dc78749bdaaf441501edc21e218e020236e2ebea1b6a96d0bac7',
      index: 6,
      l1VerificationHash: '0x541407978cf4a091167c97b9141d34261329b48423631218dc644fecaa94f176',
      type: 'deploy',
      to: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
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
    blockId: '0x2c6b3d318f93b500b44dcf565f65dda066f22cae6f4d76e3ec479193d77a511',
    blockNumber: 238254,
    hash: '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
    index: 13,
    l1VerificationHash: '0x8ac5cbcb6d450c74bfd90cef3cd8317046cf45c42c7eaaf3f50d7f6d8f4e6674',
    type: 'invoke',
    to: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
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
        value: '0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      },
      {
        name: 'selector[1]',
        value: '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
      },
      {
        name: 'recipient[1]',
        value: '0x14361d05e560796ad3152e083b609f5205f3bd76039327326746ba7f769a666',
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
        from_address: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
        data: ['548469262577982069419604814212071324757767447805833156581774446435100180985', '1', '1'],
        keys: ['160509384506897785609912026407502909755389202887426828748018058577681165651'],
        transactionHash: '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
        blockHash: '0x2c6b3d318f93b500b44dcf565f65dda066f22cae6f4d76e3ec479193d77a511',
        id: '238254_13_0',
      },
    ],
  },
};

export const getTxnFromVoyagerResp2 = {
  header: {
    blockId: '0x78ba7300924ababbe80d05b9f36e9f0a3f40b6889d16662513aa7001aa7d2e5',
    blockNumber: 235032,
    hash: '0x6beceb86579dc78749bdaaf441501edc21e218e020236e2ebea1b6a96d0bac7',
    index: 6,
    l1VerificationHash: '0x541407978cf4a091167c97b9141d34261329b48423631218dc644fecaa94f176',
    type: 'deploy',
    to: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
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
        from_address: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
        data: [
          '2561146817694037944268364036216184626484657582211188385622551558011813041058',
          '482162941308656319432912742303005906397762181614840110745460294213899895886',
          '0',
        ],
        keys: ['473692704853087324234226353339653488579626936186557422111458551781472692100'],
        transactionHash: '0x6beceb86579dc78749bdaaf441501edc21e218e020236e2ebea1b6a96d0bac7',
        blockHash: '0x78ba7300924ababbe80d05b9f36e9f0a3f40b6889d16662513aa7001aa7d2e5',
        id: '235032_6_0',
      },
    ],
  },
};

export const expectedMassagedTxn4: Transaction = {
  chainId: '0x534e5f474f45524c49',
  contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  contractCallData: ['0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75', '2000000000000000000', '0'],
  contractFuncName: 'transfer',
  eventIds: [],
  failureReason: '',
  senderAddress: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
  status: 'ACCEPTED_ON_L2',
  timestamp: 1653569059,
  txnHash: '0x45ff16a2fd6b489d2e17673addba34af372907b0b23ff9068a23afa49c6138b',
  txnType: 'invoke',
};

export const expectedMassagedTxns: Transaction[] = [
  {
    txnHash: '0x1366c2f9f46b1a86ba0c28b5a08fa0aa3750c4d1cbe06e97e72bd46ae2ac1f9',
    txnType: 'invoke',
    chainId: '0x534e5f474f45524c49',
    senderAddress: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
    contractAddress: '0x7394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
    contractFuncName: 'transfer',
    contractCallData: ['0x14361d05e560796ad3152e083b609f5205f3bd76039327326746ba7f769a666', '0x0de0b6b3a7640000'],
    timestamp: 1655109666,
    failureReason: '',
    status: 'Accepted on L1',
    eventIds: ['238254_13_0'],
  },
  {
    txnHash: '0x6beceb86579dc78749bdaaf441501edc21e218e020236e2ebea1b6a96d0bac7',
    txnType: 'deploy',
    chainId: '0x534e5f474f45524c49',
    senderAddress: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
    contractAddress: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
    contractFuncName: '',
    contractCallData: [],
    timestamp: 1654834401,
    failureReason: '',
    status: 'Accepted on L1',
    eventIds: ['235032_6_0'],
  },
  expectedMassagedTxn4,
];
