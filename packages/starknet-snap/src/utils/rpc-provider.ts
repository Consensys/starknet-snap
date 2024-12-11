import { constants } from 'starknet';

import { Config } from '../config';

/**
 * Gets the rpc URL for a given Chain ID.
 *
 * @param chainId - The Chain ID.
 */
export function getRPCUrl(chainId: string) {
  switch (chainId) {
    case constants.StarknetChainId.SN_MAIN:
      return `https://starknet-mainnet.infura.io/v3/${Config.rpcApiKey}`;
    default:
    case constants.StarknetChainId.SN_SEPOLIA:
      return `https://starknet-sepolia.infura.io/v3/${Config.rpcApiKey}`;
  }
}
