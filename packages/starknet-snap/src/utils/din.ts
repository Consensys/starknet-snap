import { constants } from 'starknet';

/**
 *
 * @param chainId
 */
export function getRPCUrl(chainId: string) {
  switch (chainId) {
    case constants.StarknetChainId.SN_MAIN:
      return `https://starknet-mainnet.infura.io/v3/${getRPCCredentials()}`;
    default:
    case constants.StarknetChainId.SN_SEPOLIA:
      return `https://starknet-sepolia.infura.io/v3/${getRPCCredentials()}`;
  }
}

/**
 *
 */
export function getRPCCredentials(): string {
  // eslint-disable-next-line no-restricted-globals
  return process.env.DIN_API_KEY ?? '';
}
