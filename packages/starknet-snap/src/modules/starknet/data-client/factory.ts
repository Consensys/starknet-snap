import { DataClient, DataClientConfig, StarknetDataClientOptions } from '../../config';
import { IReadDataClient } from './types';
import { VoyagerClient } from './clients/voyager';
import { StarkScanClient } from './clients/starkscan';
import { RpcDataClient } from './clients/rpc';

export class DataClientFactory {
  static CreateReadClient(config: DataClientConfig, chainId: string): IReadDataClient {
    switch (config.read.type as DataClient) {
      case DataClient.Voyager:
        return new VoyagerClient({
          chainId,
          timeLimit: 10,
          pageSize: 10,
        });
      case DataClient.StarkScan:
        const options = config.read.options as StarknetDataClientOptions;
        return new StarkScanClient({
          chainId,
          pageSize: options.pageSize,
          timeLimit: options.timeLimitInDay * 24 * 60 * 60 * 1000,
        });
      case DataClient.Infura:
        return new RpcDataClient({
          chainId,
        });
      default:
        throw new Error(`Unsupported client type: ${config.read.type}`);
    }
  }
}
