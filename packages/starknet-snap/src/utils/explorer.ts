import { constants } from 'starknet';

import { Config } from '../config';

/**
 * Gets the explorer URL for a given address and Chain ID.
 *
 * @param address - The address to get the explorer URL for.
 * @param chainId - The Chain ID.
 * @returns The explorer URL as a string.
 * @throws An error if an invalid scope is provided.
 */
export function getExplorerUrl(address: string, chainId: string): string {
  switch (chainId) {
    case constants.StarknetChainId.SN_MAIN:
      return Config.explorer[constants.StarknetChainId.SN_MAIN].replace(
        // eslint-disable-next-line no-template-curly-in-string
        '${address}',
        address,
      );
    case constants.StarknetChainId.SN_SEPOLIA:
      return Config.explorer[constants.StarknetChainId.SN_SEPOLIA].replace(
        // eslint-disable-next-line no-template-curly-in-string
        '${address}',
        address,
      );
    default:
      throw new Error('Invalid Chain ID');
  }
}
