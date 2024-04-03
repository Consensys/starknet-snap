import { StarknetTransactionManager } from "./transaction";
import { StarknetTransactionConfig } from "../config";
import { ITransactionMgr } from "../transaction/types";
import { DataClientFactory } from "./data-client/factory";

export type StarknetTransactionMgrBuilderConfig = {
  chainId: string,
  pageSize: number
}

export class Factory {
  static CreateStarkNetTransactionMgr(
    config: StarknetTransactionConfig,
    builderConfig: StarknetTransactionMgrBuilderConfig
  ): ITransactionMgr {
    const readClient = DataClientFactory.CreateReadClient(
      config.dataClient,
      builderConfig.chainId,
      builderConfig.pageSize
    );
    return new StarknetTransactionManager(readClient);
  }
}
