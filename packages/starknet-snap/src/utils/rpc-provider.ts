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
      return `https://starknet-mainnet.infura.io/v3/${Config.rpcApiKey}`;
    default:
    case constants.StarknetChainId.SN_SEPOLIA:
      return `https://starknet-sepolia.infura.io/v3/${Config.rpcApiKey}`;
  }
}

/**
 *
 * @param chainId - The Chain ID.
 * @returns Whether the RPC V8 is enabled for the given chain.
 */
export const isEnableRPCV8 = (chainId: constants.StarknetChainId) => {
  return Config.enableRPCV8[chainId];
};
