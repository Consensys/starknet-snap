import { Signature } from 'starknet';
import { ApiParams, SignTransactionParams } from './types/snapApi';
import { getKeysFromAddress, signTransactions } from './utils/starknetUtils';
import { getNetworkFromChainId } from './utils/snapUtils';
import { logger } from '../src/utils/logger';

export async function signTransaction(params: ApiParams): Promise<Signature> {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as SignTransactionParams;
    const userAddress = requestParamsObj.userAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey } = await getKeysFromAddress(keyDeriver, network, state, userAddress);
    const signatures = await signTransactions(
      privateKey,
      requestParamsObj.transactions,
      requestParamsObj.transactionsDetail,
      requestParamsObj.abis,
    );
    return signatures;
  } catch (error) {
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
