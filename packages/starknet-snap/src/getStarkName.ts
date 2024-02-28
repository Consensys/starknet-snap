import { toJson } from './utils/serializer';
import { getStarkNameUtil, validateAndParseAddress } from '../src/utils/starknetUtils';
import { ApiParams, GetStarkNameRequestParam } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import { logger } from './utils/logger';

export async function getStarkName(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetStarkNameRequestParam;

    if (!requestParamsObj.userAddress) {
      throw new Error(`The given user address need to be non-empty string, got: ${toJson(requestParamsObj)}`);
    }

    try {
      validateAndParseAddress(requestParamsObj.userAddress);
    } catch (err) {
      throw new Error(`The given user address is invalid: ${requestParamsObj.userAddress}`);
    }

    const userAddress = requestParamsObj.userAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const resp = await getStarkNameUtil(network, userAddress);
    logger.log(`getStarkName: name:\n${toJson(resp)}`);

    return resp;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
