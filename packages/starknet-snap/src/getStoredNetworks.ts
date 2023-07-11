import { toJson } from './utils/serializer';
import { ApiParams } from './types/snapApi';
import { getNetworks } from './utils/snapUtils';

export async function getStoredNetworks(params: ApiParams) {
  try {
    const { state } = params;

    const networks = getNetworks(state);
    console.log(`getStoredNetworks: networks:\n${toJson(networks, 2)}`);

    return networks;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
