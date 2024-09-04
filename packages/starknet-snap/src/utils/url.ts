import { Config } from '../config';
import { SnapEnv } from './constants';

export const DappUrl = {
  [SnapEnv.Dev]: 'https://dev.snaps.consensys.io/starknet',
  [SnapEnv.Staging]: 'https://staging.snaps.consensys.io/starknet',
  [SnapEnv.Prod]: 'https://snaps.consensys.io/starknet',
};

/**
 * Retrieves the dapp Url by environment.
 *
 * @param snapEnv - The enum of the SnapEnv.
 * @returns The dapp url.
 */
export function getDappUrlByEnv(snapEnv: SnapEnv): string {
  switch (snapEnv) {
    case SnapEnv.Dev:
      return DappUrl.dev;
    case SnapEnv.Staging:
      return DappUrl.staging;
    case SnapEnv.Prod:
      return DappUrl.prod;
    default:
      return DappUrl.prod;
  }
}

/**
 * Retrieves the dapp Url base on snap configuration - `Config.snapEnv`.
 *
 * @returns The dapp url.
 */
export function getDappUrl(): string {
  return getDappUrlByEnv(Config.snapEnv);
}
