import type {
  ApiParams,
  GetStoredErc20TokensRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getErc20Tokens, getNetworkFromChainId } from './utils/snapUtils';

/**
 *
 * @param params
 */
export async function getStoredErc20Tokens(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetStoredErc20TokensRequestParams;

    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const erc20Tokens = getErc20Tokens(state, network.chainId);
    logger.log(`getStoredErc20Tokens: erc20Tokens:\n${toJson(erc20Tokens, 2)}`);

    return erc20Tokens;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
