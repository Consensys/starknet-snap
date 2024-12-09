import { constants } from 'starknet';

import { Config } from '../config';

/**
 *
 * @param chainId
 */
export function getRPCUrl(chainId: string) {
  switch (chainId) {
    case constants.StarknetChainId.SN_MAIN:
      return Config.rpcEndpoint[constants.StarknetChainId.SN_MAIN];
    default:
    case constants.StarknetChainId.SN_SEPOLIA:
      return Config.rpcEndpoint[constants.StarknetChainId.SN_SEPOLIA];
  }
}
