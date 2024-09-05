import { constants } from 'starknet';

import type { Erc20Token, Network } from '../types/snapState';

export const VOYAGER_API_TXN_URL_SUFFIX = '/api/txn';
export const VOYAGER_API_TXNS_URL_SUFFIX = '/api/txns';

export const DEFAULT_DECIMAL_PLACES = 18;
export const DEFAULT_GET_TXNS_PAGE_SIZE = 10;
export const DEFAULT_GET_TXNS_LAST_NUM_OF_DAYS = 10;
export const MAXIMUM_NETWORK_NAME_LENGTH = 64;
export const MAXIMUM_TOKEN_NAME_LENGTH = 64;
export const MAXIMUM_TOKEN_SYMBOL_LENGTH = 16;

export const TRANSFER_SELECTOR_HEX =
  '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e';
export const UPGRADE_SELECTOR_HEX =
  '0xf2f7c15cbe06c8d94597cd91fd7f3369eae842359235712def5584f8d270cd';

export const ACCOUNT_CLASS_HASH_LEGACY =
  '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2'; // from argent-x repo
export const ACCOUNT_CLASS_HASH =
  '0x29927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b'; // from argent-x repo

export const STARKNET_MAINNET_NETWORK: Network = {
  name: 'Starknet Mainnet',
  chainId: constants.StarknetChainId.SN_MAIN,
  baseUrl: 'https://alpha-mainnet.starknet.io',
  nodeUrl: '',
  voyagerUrl: 'https://voyager.online',
  accountClassHash: '',
};

// Keep this constants for unit test
export const STARKNET_TESTNET_NETWORK: Network = {
  name: 'Goerli Testnet (deprecated)',
  chainId: '0x534e5f474f45524c49',
  baseUrl: '',
  nodeUrl: '',
  voyagerUrl: '',
  accountClassHash: '',
};

// TODO: Importing directly from constants when upgrading to starknet.js v6
const SN_SEPOLIA = {
  name: 'Sepolia Testnet',
  baseUrl: 'https://alpha-sepolia.starknet.io',
  chainId: '0x534e5f5345504f4c4941',
  nodeUrl: '',
  voyagerUrl: 'https://sepolia.voyager.online',
};

export const STARKNET_SEPOLIA_TESTNET_NETWORK: Network = {
  name: SN_SEPOLIA.name,
  chainId: SN_SEPOLIA.chainId,
  baseUrl: SN_SEPOLIA.baseUrl,
  nodeUrl: SN_SEPOLIA.nodeUrl,
  voyagerUrl: SN_SEPOLIA.voyagerUrl,
  accountClassHash: '', // from argent-x repo
};

export const ETHER_MAINNET: Erc20Token = {
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
  chainId: STARKNET_MAINNET_NETWORK.chainId,
};

export const ETHER_SEPOLIA_TESTNET: Erc20Token = {
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
  chainId: SN_SEPOLIA.chainId,
};

export const DAI_MAINNET: Erc20Token = {
  address: '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3',
  name: 'DAI',
  symbol: 'DAI',
  decimals: 18,
  chainId: STARKNET_MAINNET_NETWORK.chainId,
};

export const DAI_SEPOLIA_TESTNET: Erc20Token = {
  address: '0x03e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
  name: 'DAI',
  symbol: 'DAI',
  decimals: 18,
  chainId: SN_SEPOLIA.chainId,
};

export const STRK_MAINNET: Erc20Token = {
  address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  name: 'Starknet Token',
  symbol: 'STRK',
  decimals: 18,
  chainId: STARKNET_MAINNET_NETWORK.chainId,
};

export const STRK_SEPOLIA_TESTNET: Erc20Token = {
  address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  name: 'Starknet Token',
  symbol: 'STRK',
  decimals: 18,
  chainId: SN_SEPOLIA.chainId,
};

export const USDC_MAINNET: Erc20Token = {
  address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  chainId: STARKNET_MAINNET_NETWORK.chainId,
};

export const USDC_SEPOLIA_TESTNET: Erc20Token = {
  address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  chainId: SN_SEPOLIA.chainId,
};

export const USDT_MAINNET: Erc20Token = {
  address: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
  name: 'Tether USD',
  symbol: 'USDT',
  decimals: 6,
  chainId: STARKNET_MAINNET_NETWORK.chainId,
};

export const USDT_SEPOLIA_TESTNET: Erc20Token = {
  address: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
  name: 'Tether USD',
  symbol: 'USDT',
  decimals: 6,
  chainId: SN_SEPOLIA.chainId,
};

export const TEST_TOKEN_MAINNET: Erc20Token = {
  address: '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
  name: 'Test Token',
  symbol: 'TEST',
  decimals: 18,
  chainId: STARKNET_MAINNET_NETWORK.chainId,
};

export const PRELOADED_TOKENS = [
  ETHER_MAINNET,
  ETHER_SEPOLIA_TESTNET,
  USDC_MAINNET,
  USDC_SEPOLIA_TESTNET,
  USDT_MAINNET,
  USDT_SEPOLIA_TESTNET,
  STRK_MAINNET,
  STRK_SEPOLIA_TESTNET,
];

export const PRELOADED_NETWORKS = [
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
];

export const PROXY_CONTRACT_HASH =
  '0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918'; // for cairo 0 proxy contract

export const MIN_ACC_CONTRACT_VERSION = [0, 3, 0];

export const CAIRO_VERSION = '1';

export const CAIRO_VERSION_LEGACY = '0';

export enum BlockIdentifierEnum {
  Latest = 'latest',
  Pending = 'pending',
}

export enum SnapEnv {
  Dev = 'dev',
  Staging = 'staging',
  Prod = 'prod',
}
