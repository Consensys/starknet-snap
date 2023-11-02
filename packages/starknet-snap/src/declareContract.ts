import { ApiParams, DeclareContractRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import { getKeysFromAddress, declareContract as declareContractUtil } from './utils/starknetUtils';

import { logger } from './utils/logger';

export async function declareContract(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as DeclareContractRequestParams;
    const senderAddress = requestParamsObj.senderAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);
    return await declareContractUtil(
      network,
      senderAddress,
      privateKey,
      requestParamsObj.contractPayload,
      requestParamsObj.transactionsDetail,
    );
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
