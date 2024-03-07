import { constants } from 'starknet';
import { Erc20Token, Network } from '../types/snapState';

export const VOYAGER_API_TXN_URL_SUFFIX = '/api/txn';
export const VOYAGER_API_TXNS_URL_SUFFIX = '/api/txns';

export const DEFAULT_DECIMAL_PLACES = 18;
export const DEFAULT_GET_TXNS_PAGE_SIZE = 10;
export const DEFAULT_GET_TXNS_LAST_NUM_OF_DAYS = 10;
export const MAXIMUM_NETWORK_NAME_LENGTH = 64;
export const MAXIMUM_TOKEN_NAME_LENGTH = 64;
export const MAXIMUM_TOKEN_SYMBOL_LENGTH = 16;

export const TRANSFER_SELECTOR_HEX = '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e';

export const ACCOUNT_CLASS_HASH_V0 = '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2'; // from argent-x repo

interface IDappConfig {
  dev: string;
  staging: string;
  prod: string;
}

export const DAPP: IDappConfig = {
  dev: 'https://dev.snaps.consensys.io/starknet',
  staging: 'https://staging.snaps.consensys.io/starknet',
  prod: 'https://snaps.consensys.io/starknet',
};

export const STARKNET_MAINNET_NETWORK: Network = {
  name: 'Starknet Mainnet',
  chainId: constants.StarknetChainId.SN_MAIN,
  baseUrl: 'https://alpha-mainnet.starknet.io',
  nodeUrl: 'https://starknet-mainnet.infura.io/v3/60c7253fb48147658095fe0460ac9ee9',
  voyagerUrl: 'https://voyager.online',
  accountClassHash: '', // from argent-x repo
};

export const STARKNET_TESTNET_NETWORK: Network = {
  name: 'Goerli Testnet (deprecated soon)',
  chainId: constants.StarknetChainId.SN_GOERLI,
  baseUrl: 'https://alpha4.starknet.io',
  nodeUrl: 'https://starknet-goerli.infura.io/v3/60c7253fb48147658095fe0460ac9ee9',
  voyagerUrl: 'https://goerli.voyager.online',
  accountClassHash: '', // from argent-x repo
};

// TODO: Importing directly from constants when upgrading to starknet.js v6
const SN_SEPOLIA = {
  name: 'Sepolia Testnet',
  baseUrl: 'https://alpha-sepolia.starknet.io',
  chainId: '0x534e5f5345504f4c4941',
  nodeUrl: 'https://starknet-sepolia.infura.io/v3/60c7253fb48147658095fe0460ac9ee9',
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

export const STARKNET_INTEGRATION_NETWORK: Network = {
  name: 'Goerli Integration',
  chainId: constants.StarknetChainId.SN_GOERLI,
  baseUrl: 'https://external.integration.starknet.io',
  nodeUrl: '',
  voyagerUrl: '',
  accountClassHash: '', // from argent-x repo
};

export const ETHER_MAINNET: Erc20Token = {
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
  chainId: STARKNET_MAINNET_NETWORK.chainId,
};

export const ETHER_TESTNET: Erc20Token = {
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
  chainId: STARKNET_TESTNET_NETWORK.chainId,
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

export const DAI_TESTNET: Erc20Token = {
  address: '0x03e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
  name: 'DAI',
  symbol: 'DAI',
  decimals: 18,
  chainId: STARKNET_TESTNET_NETWORK.chainId,
};

export const DAI_SEPOLIA_TESTNET: Erc20Token = {
  address: '0x03e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
  name: 'DAI',
  symbol: 'DAI',
  decimals: 18,
  chainId: SN_SEPOLIA.chainId,
};

export const WBTC_TESTNET: Erc20Token = {
  address: '0x12d537dc323c439dc65c976fad242d5610d27cfb5f31689a0a319b8be7f3d56',
  name: 'Wrapped BTC',
  symbol: 'WBTC',
  decimals: 8,
  chainId: STARKNET_TESTNET_NETWORK.chainId,
};

export const STRK_MAINNET: Erc20Token = {
  address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  name: 'Starknet Token',
  symbol: 'STRK',
  decimals: 18,
  chainId: STARKNET_MAINNET_NETWORK.chainId,
};

export const STRK_TESTNET: Erc20Token = {
  address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  name: 'Starknet Token',
  symbol: 'STRK',
  decimals: 18,
  chainId: STARKNET_TESTNET_NETWORK.chainId,
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

export const USDC_TESTNET: Erc20Token = {
  address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  chainId: STARKNET_TESTNET_NETWORK.chainId,
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

export const USDT_TESTNET: Erc20Token = {
  address: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
  name: 'Tether USD',
  symbol: 'USDT',
  decimals: 6,
  chainId: STARKNET_TESTNET_NETWORK.chainId,
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

export const TEST_TOKEN_TESTNET: Erc20Token = {
  address: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
  name: 'Test Token',
  symbol: 'TEST',
  decimals: 18,
  chainId: STARKNET_TESTNET_NETWORK.chainId,
};

export const PRELOADED_TOKENS = [
  ETHER_MAINNET,
  ETHER_TESTNET,
  ETHER_SEPOLIA_TESTNET,
  USDC_MAINNET,
  USDC_TESTNET,
  USDC_SEPOLIA_TESTNET,
  USDT_MAINNET,
  USDT_TESTNET,
  USDT_SEPOLIA_TESTNET,
  STRK_MAINNET,
  STRK_TESTNET,
  STRK_SEPOLIA_TESTNET,
];

export const PRELOADED_NETWORKS = [
  STARKNET_MAINNET_NETWORK,
  STARKNET_TESTNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  STARKNET_INTEGRATION_NETWORK,
];

export const PROXY_CONTRACT_HASH = '0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918'; // from argent-x repo
