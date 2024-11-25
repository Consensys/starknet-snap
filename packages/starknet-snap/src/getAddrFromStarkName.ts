import type {
  ApiParams,
  GetAddrFromStarkNameRequestParam,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId } from './utils/snapUtils';
import { getAddrFromStarkNameUtil } from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function getAddrFromStarkName(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetAddrFromStarkNameRequestParam;

    if (!requestParamsObj.starkName) {
      throw new Error(
        `The given stark name need to be non-empty string, got: ${toJson(
          requestParamsObj,
        )}`,
      );
    }

    const { starkName } = requestParamsObj;

    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const resp = await getAddrFromStarkNameUtil(network, starkName);
    logger.log(`getAddrFromStarkName: addr:\n${toJson(resp)}`);

    return resp;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
