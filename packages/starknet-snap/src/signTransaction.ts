import { Signature } from 'starknet';
import { ApiParams, SignTransactionParams } from './types/snapApi';
import { getKeysFromAddress, signTransactions } from './utils/starknetUtils';
import { getNetworkFromChainId } from './utils/snapUtils';

export async function signTransaction(params: ApiParams): Promise<Signature> {
  const { state, keyDeriver, requestParams } = params;
  const requestParamsObj = requestParams as SignTransactionParams;
  const userAddress = requestParamsObj.userAddress;
  const network = getNetworkFromChainId(state, requestParamsObj.chainId);
  const { privateKey } = await getKeysFromAddress(keyDeriver, network, state, userAddress);

  try {
    const signatures = await signTransactions(
      privateKey,
      requestParamsObj.transactions,
      requestParamsObj.transactionsDetail,
      requestParamsObj.abis,
    );
    return signatures;
  } catch (error) {
    console.error(`Problem found: ${error}`);
    throw error;
  }
}
