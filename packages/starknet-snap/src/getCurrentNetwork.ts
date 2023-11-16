import { toJson } from './utils/serializer';
import { ApiParams } from './types/snapApi';
import { getCurrentNetwork as getCurrentNetworkUtil } from './utils/snapUtils';
import { logger } from './utils/logger';

export async function getCurrentNetwork(params: ApiParams) {
  try {
    const { state } = params;
    const networks = getCurrentNetworkUtil(state);
    logger.log(`getCurrentNetwork: networks:\n${toJson(networks, 2)}`);
    return networks;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
