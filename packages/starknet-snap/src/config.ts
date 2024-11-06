import { constants } from 'starknet';

import type { Erc20Token, Network } from './types/snapState';
import {
  SnapEnv,
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  ETHER_MAINNET,
  ETHER_SEPOLIA_TESTNET,
  USDC_MAINNET,
  USDC_SEPOLIA_TESTNET,
  USDT_MAINNET,
  USDT_SEPOLIA_TESTNET,
  STRK_MAINNET,
  STRK_SEPOLIA_TESTNET,
} from './utils/constants';
import { LogLevel } from './utils/logger';

export type SnapConfig = {
  logLevel: string;
  snapEnv: SnapEnv;
  defaultNetwork: Network;
  availableNetworks: Network[];
  preloadTokens: Erc20Token[];
  explorer: {
    [key: string]: string;
  };
};

export const Config: SnapConfig = {
  // eslint-disable-next-line no-restricted-globals
  logLevel: process.env.LOG_LEVEL ?? LogLevel.OFF.valueOf().toString(),
  // eslint-disable-next-line no-restricted-globals
  snapEnv: (process.env.SNAP_ENV ?? SnapEnv.Prod) as unknown as SnapEnv,

  defaultNetwork: STARKNET_MAINNET_NETWORK,

  availableNetworks: [
    STARKNET_MAINNET_NETWORK,
    STARKNET_SEPOLIA_TESTNET_NETWORK,
  ],

  explorer: {
    [constants.StarknetChainId.SN_MAIN]:
      // eslint-disable-next-line no-template-curly-in-string
      'https://voyager.online/contract/${address}',
    [constants.StarknetChainId.SN_SEPOLIA]:
      // eslint-disable-next-line no-template-curly-in-string
      'https://sepolia.voyager.online/contract/${address}',
  },

  preloadTokens: [
    ETHER_MAINNET,
    ETHER_SEPOLIA_TESTNET,
    USDC_MAINNET,
    USDC_SEPOLIA_TESTNET,
    USDT_MAINNET,
    USDT_SEPOLIA_TESTNET,
    STRK_MAINNET,
    STRK_SEPOLIA_TESTNET,
  ],
};
