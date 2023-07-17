import { toJson } from './utils/serializer';
import { ApiParams } from './types/snapApi';
import { getNetworks } from './utils/snapUtils';
import { logger } from './utils/logger';

export async function getStoredNetworks(params: ApiParams) {
  try {
    const { state } = params;

    const networks = getNetworks(state);
    logger.log(`getStoredNetworks: networks:\n${toJson(networks, 2)}`);

    return networks;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
