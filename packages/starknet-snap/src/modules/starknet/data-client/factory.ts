import { DataClient, DataClientConfig, StarknetDataClientOptions } from '../../config';
import { IReadDataClient } from './types';
import { VoyagerClient } from './clients/voyager';
import { StarkScanClient } from './clients/starkscan';
import { RpcDataClient } from './clients/rpc';

export class DataClientFactory {
  static CreateRPCReadClient(config: DataClientConfig, chainId: string): IReadDataClient {
    switch (config.read.Rpc.type as DataClient) {
      case DataClient.Infura:
        return new RpcDataClient({
          apiKey: config.read.Rpc.options.apiKey,
          chainId,
        });
      default:
        throw new Error(`Unsupported client type: ${config.read.Rpc.type}`);
    }
  }

  static CreateRestfulReadClient(config: DataClientConfig, chainId: string): IReadDataClient {
    switch (config.read.Restful.type as DataClient) {
      case DataClient.Voyager:
        const voyagerOptions = config.read.Restful.options as StarknetDataClientOptions;
        return new VoyagerClient({
          chainId,
          apiKey: voyagerOptions.apiKey,
          timeLimit: voyagerOptions.timeLimitInDay * 24 * 60 * 60 * 1000,
          pageSize: voyagerOptions.pageSize,
        });
      case DataClient.StarkScan:
        const starkscanOptions = config.read.Restful.options as StarknetDataClientOptions;
        return new StarkScanClient({
          chainId,
          apiKey: starkscanOptions.apiKey,
          pageSize: starkscanOptions.pageSize,
          timeLimit: starkscanOptions.timeLimitInDay * 24 * 60 * 60 * 1000,
        });
      default:
        throw new Error(`Unsupported client type: ${config.read.Restful.type}`);
    }
  }
}
