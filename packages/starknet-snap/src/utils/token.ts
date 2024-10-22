import { Config } from '../config';
import { isSameChainId } from './snapUtils';

/**
 * Check if the token is preloaded token.
 *
 * @param params - The params object.
 * @param params.tokenName - The token name.
 * @param params.chainId - The chain id.
 * @param params.tokenSymbol - The token symbol.
 * @param params.tokenAddress - The token address.
 * @returns True if the token is preloaded token, false otherwise.
 */
export function isPreloadedToken({
  tokenName,
  tokenSymbol,
  tokenAddress,
  chainId,
}: {
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  chainId: string;
}) {
  const bigIntTokenAddress = BigInt(tokenAddress);
  return Boolean(
    Config.preloadTokens.find(
      (token) =>
        (token.name.trim() === tokenName.trim() ||
          token.symbol.trim() === tokenSymbol.trim() ||
          BigInt(token.address) === bigIntTokenAddress) &&
        isSameChainId(token.chainId, chainId),
    ),
  );
}
