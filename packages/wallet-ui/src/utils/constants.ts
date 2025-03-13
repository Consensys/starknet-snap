import { constants } from 'starknet';
import { Account, FeeToken } from 'types';

// TODO: Importing directly from constants when upgrading to starknet.js v6
export const SEPOLIA_CHAINID = '0x534e5f5345504f4c4941';

export const ETH_TOKEN_ADDR =
  '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

export const STRK_TOKEN_ADDR =
  '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

export const TOKENS: any = {
  [constants.StarknetChainId.SN_MAIN]: {
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7': {
      coingeckoId: 'ethereum',
    },
    '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d': {
      coingeckoId: 'starknet',
    },
  },
  [SEPOLIA_CHAINID]: {
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7': {
      coingeckoId: 'ethereum',
    },
    '0x12d537dc323c439dc65c976fad242d5610d27cfb5f31689a0a319b8be7f3d56': {
      coingeckoId: 'wrapped-bitcoin',
    },
    '0x386e8d061177f19b3b485c20e31137e6f6bc497cc635ccdfcab96fadf5add6a': {
      coingeckoId: 'tether',
    },
    '0x03e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9': {
      coingeckoId: 'dai',
    },
    '0x005a643907b9a4bc6a55e9069c4fd5fd1f5c79a22470690f75556c4736e34426': {
      coingeckoId: 'usd-coin',
    },
    '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d': {
      coingeckoId: 'starknet',
    },
  },
};

export const DECIMALS_DISPLAYED_MAX_LENGTH = 11;

export const COINGECKO_API = 'https://api.coingecko.com/api/v3/';

export const STARKNET_MAINNET_EXPLORER = 'https://starkscan.co/';

export const STARKNET_SEPOLIA_TESTNET_EXPLORER =
  'https://sepolia.starkscan.co/';

export const SNAPS_DOC_URL = 'https://docs.metamask.io/guide/snaps.html';

export const STARKNET_ADDRESS_LENGTH = 66;

export const ASSETS_PRICE_REFRESH_FREQUENCY = 120000;

export const ESTIMATE_FEE_REFRESH_FREQUENCY = 3000;

export const ESTIMATE_FEE_CACHE_DURATION = 60000;

export const INPUT_MAX_LENGTH = 100;

export const POPOVER_DURATION = 3000;

export const TRANSACTIONS_REFRESH_FREQUENCY = 60000;

export const TOKEN_BALANCE_REFRESH_FREQUENCY = 60000;

export const TIMEOUT_DURATION = 10000;

export const MIN_ACC_CONTRACT_VERSION = [0, 3, 0];

export const defaultAccount = {
  address: '0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  addressIndex: 0,
} as Account;

export const DEFAULT_FEE_TOKEN = FeeToken.ETH;

export const MIN_METAMASK_VERSION = '12.5.0';

export const DENY_ERROR_CODE = 113;

// Account name length range - [min, max]
export const ACCOUNT_NAME_LENGTH = [1, 20];
