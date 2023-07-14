import { toJson } from './utils/serializer';
import { ApiParams, GetTransactionStatusRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import * as utils from './utils/starknetUtils';
import { logger } from './utils/logger';

export async function getTransactionStatus(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetTransactionStatusRequestParams;

    const transactionHash = requestParamsObj.transactionHash;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const getTxnStatusResp = await utils.getTransactionStatus(transactionHash, network);
    logger.log(`getTransactionStatus:\ngetTxnStatusResp: ${toJson(getTxnStatusResp)}`);

    return getTxnStatusResp;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
