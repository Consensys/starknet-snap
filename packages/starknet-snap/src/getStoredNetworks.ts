import { ApiParams } from './types/snapApi';
import { getNetworks } from './utils/snapUtils';

export async function getStoredNetworks(params: ApiParams) {
  try {
    const { state } = params;

    const networks = getNetworks(state);
    console.log(`getStoredNetworks: networks:\n${JSON.stringify(networks, null, 2)}`);

    return networks;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
