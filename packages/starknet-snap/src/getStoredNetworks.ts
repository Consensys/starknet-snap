import type { ApiParams } from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworks } from './utils/snapUtils';

/**
 *
 * @param params
 */
export async function getStoredNetworks(params: ApiParams) {
  try {
    const { state } = params;

    const networks = getNetworks(state);
    logger.log(`getStoredNetworks: networks:\n${toJson(networks, 2)}`);

    return networks;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
