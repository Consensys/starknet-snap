import type { ApiParams } from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getCurrentNetwork as getCurrentNetworkUtil } from './utils/snapUtils';

/**
 *
 * @param params
 */
export async function getCurrentNetwork(params: ApiParams) {
  try {
    const { state } = params;
    const networks = getCurrentNetworkUtil(state);
    logger.log(`getCurrentNetwork: networks:\n${toJson(networks, 2)}`);
    return networks;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
