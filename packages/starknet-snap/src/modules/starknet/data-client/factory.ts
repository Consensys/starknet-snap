import { DataClient, DataClientConfig } from "../../config";
import { IReadDataClient, IWriteDataClient } from "./types";
import { VoyagerClient } from "./clients/voyager";
import { StarkScanClient } from "./clients/starkscan";

export class DataClientFactory {
  static CreateReadClient(
    config: DataClientConfig,
    chainId: string,
    pageSize: number
  ): IReadDataClient {
    switch (config.read.type as DataClient) {
      case DataClient.Voyager:
        return new VoyagerClient({
          chainId,
          pageSize
        });
      case DataClient.StarkScan:
          return new StarkScanClient({
            chainId,
            pageSize
          });
      default:
        throw new Error(`Unsupported client type: ${config.read.type}`);
    }
  }
}
