import { toJson } from './utils/serializer';
import { ApiParams, GetStoredErc20TokensRequestParams } from './types/snapApi';
import { getErc20Tokens, getNetworkFromChainId } from './utils/snapUtils';
import { logger } from './utils/logger';

export async function getStoredErc20Tokens(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetStoredErc20TokensRequestParams;

    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const erc20Tokens = getErc20Tokens(state, network.chainId);
    logger.log(`getStoredErc20Tokens: erc20Tokens:\n${toJson(erc20Tokens, 2)}`);

    return erc20Tokens;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
