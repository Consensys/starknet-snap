import { StarknetTransactionManager } from './transaction';
import { DataClient, StarknetTransactionConfig } from '../config';
import { ITransactionMgr } from '../transaction/types';
import { DataClientFactory } from './data-client/factory';

export type StarknetTransactionMgrBuilderConfig = {
  chainId: string;
};

export class Factory {
  static CreateStarkNetTransactionMgr(
    config: StarknetTransactionConfig,
    builderConfig: StarknetTransactionMgrBuilderConfig,
  ): ITransactionMgr {
    const readClient = DataClientFactory.CreateReadClient(config.dataClient, builderConfig.chainId);
    const rpcClient = DataClientFactory.CreateReadClient(
      {
        read: {
          type: DataClient.Infura,
          options: {},
        },
      },
      builderConfig.chainId,
    );
    return new StarknetTransactionManager(readClient, rpcClient);
  }
}
