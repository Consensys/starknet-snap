import { toJson } from './utils/serializer';
import { ApiParams, GetStoredTransactionsRequestParams } from './types/snapApi';
import { DEFAULT_GET_TXNS_LAST_NUM_OF_DAYS } from './utils/constants';
import { getNetworkFromChainId, getTransactions, getValidNumber } from './utils/snapUtils';
import { logger } from './utils/logger';

export async function getStoredTransactions(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetStoredTransactionsRequestParams;

    const txnsInLastNumOfDays = getValidNumber(
      requestParamsObj.txnsInLastNumOfDays,
      DEFAULT_GET_TXNS_LAST_NUM_OF_DAYS,
      1,
    );
    const minTimeStamp = Date.now() - txnsInLastNumOfDays * 24 * 60 * 60 * 1000; // in ms
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const transactions = getTransactions(
      state,
      network.chainId,
      requestParamsObj.senderAddress,
      requestParamsObj.contractAddress,
      requestParamsObj.txnType,
      undefined,
      minTimeStamp,
    );

    logger.log(`getStoredTransactions: transactions:\n${toJson(transactions, 2)}`);
    return transactions;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
