import type { IDataClient } from '../chain/data-client';
import { StarkScanClient } from '../chain/data-client/starkscan';
import { Config, DataClient } from '../config';
import type { Network } from '../types/snapState';

/**
 * Create a StarkScan client.
 *
 * @param network - The network to create the data client for.
 * @returns The StarkScan client.
 * @throws Error if the StarkScan API key is missing.
 */
export function createStarkScanClient(network: Network): IDataClient {
  const { apiKey } = Config.dataClient[DataClient.STARKSCAN];

  if (!apiKey) {
    throw new Error('Missing StarkScan API key');
  }

  const dataClient = new StarkScanClient(network, {
    apiKey,
  });

  return dataClient;
}
