import { Config, DataClientDriver } from '../config';
import type { Network } from '../types/snapState';
import { ChainService } from './chain';
import type { IDataClient } from './data-client';
import type { StarkScanOptions } from './data-client/starkscan';
import { StarkScanClient } from './data-client/starkscan';

export const createChainService = (network: Network) => {
  let client: IDataClient;

  const { driver, options } = Config.transaction.dataClient;

  switch (driver) {
    case DataClientDriver.StarkScan:
      client = new StarkScanClient(
        network,
        options as unknown as StarkScanOptions,
      );
      break;
    default:
      throw new Error('Invalid Data Client');
  }

  return new ChainService(client);
};
