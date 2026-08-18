import { constants } from 'starknet';

import { Config } from '../config';

/**
 * Gets the rpc URL for a given Chain ID.
 *
 * @param chainId - The Chain ID.
 * @returns The RPC node endpoint of the corresponding chain.
 */
export function getRPCUrl(chainId: string) {
  switch (chainId) {
    case constants.StarknetChainId.SN_MAIN:
      return `https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_9/${Config.rpcApiKeyAlchemy}`;
    default:
    case constants.StarknetChainId.SN_SEPOLIA:
      return `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/${Config.rpcApiKeyAlchemy}`;
  }
}
