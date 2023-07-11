import { toJson } from './utils/serializer';
import { ApiParams, GetStoredErc20TokensRequestParams } from './types/snapApi';
import { getErc20Tokens, getNetworkFromChainId } from './utils/snapUtils';

export async function getStoredErc20Tokens(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetStoredErc20TokensRequestParams;

    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const erc20Tokens = getErc20Tokens(state, network.chainId);
    console.log(`getStoredErc20Tokens: erc20Tokens:\n${toJson(erc20Tokens, 2)}`);

    return erc20Tokens;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
