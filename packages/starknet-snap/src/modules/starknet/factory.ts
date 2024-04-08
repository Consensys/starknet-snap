import { StarknetTransactionManager } from './transaction';
import { StarknetTransactionConfig } from '../config';
import { ITransactionMgr } from '../transaction/types';
import { Lock } from '../transaction/lock';
import { DataClientFactory } from './data-client/factory';
import { StarknetTransactionStateManager } from './transaction/state';

export type StarknetTransactionMgrBuilderConfig = {
  chainId: string;
};

export class Factory {
  static CreateStarkNetTransactionMgr(
    config: StarknetTransactionConfig,
    builderConfig: StarknetTransactionMgrBuilderConfig,
  ): ITransactionMgr {
    const readClient = DataClientFactory.CreateReadClient(config.dataClient, builderConfig.chainId);
    return new StarknetTransactionManager(readClient);
  }
}
