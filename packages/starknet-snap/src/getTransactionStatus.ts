import type {
  ApiParams,
  GetTransactionStatusRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId } from './utils/snapUtils';
import * as utils from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function getTransactionStatus(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetTransactionStatusRequestParams;

    const { transactionHash } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const getTxnStatusResp = await utils.getTransactionStatus(
      transactionHash,
      network,
    );
    logger.log(
      `getTransactionStatus:\ngetTxnStatusResp: ${toJson(getTxnStatusResp)}`,
    );

    return getTxnStatusResp;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
