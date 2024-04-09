import { Config } from '../config';
import { ITransactionMgr } from '../transaction/types';
import { DataClientFactory } from './data-client/factory';
import { StarknetTransactionManager } from './transaction';

export type StarknetTransactionMgrBuilderConfig = {
  chainId: string;
};

export class Factory {
  static CreateStarknetTransactionMgr(builderConfig: StarknetTransactionMgrBuilderConfig): ITransactionMgr {
    const config = Config.transaction[Config.network];

    const readClient = DataClientFactory.CreateRestfulReadClient(config.dataClient, builderConfig.chainId);
    const rpcClient = DataClientFactory.CreateRPCReadClient(config.dataClient, builderConfig.chainId);
    return new StarknetTransactionManager(readClient, rpcClient);
  }
}
