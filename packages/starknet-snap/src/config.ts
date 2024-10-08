import { Network } from './types/snapState';
import { SnapEnv, STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK } from './utils/constants';
import { LogLevel } from './utils/logger';

export type SnapConfig = {
  logLevel: string;
  snapEnv: SnapEnv;
  defaultNetwork: Network;
  availableNetworks: Network[];
};

export const Config: SnapConfig = {
  // eslint-disable-next-line no-restricted-globals
  logLevel: process.env.LOG_LEVEL ?? LogLevel.OFF.valueOf().toString(),
  // eslint-disable-next-line no-restricted-globals
  snapEnv: (process.env.SNAP_ENV ?? SnapEnv.Prod) as unknown as SnapEnv,

  defaultNetwork: STARKNET_MAINNET_NETWORK,

  availableNetworks: [
    STARKNET_MAINNET_NETWORK,
    STARKNET_SEPOLIA_TESTNET_NETWORK
  ]
};
