import type {
  ApiParams,
  GetStoredUserAccountsRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getAccounts, getNetworkFromChainId } from './utils/snapUtils';

/**
 *
 * @param params
 */
export async function getStoredUserAccounts(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj =
      requestParams as GetStoredUserAccountsRequestParams;

    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    // Only return the initialized or deploy-pending accounts
    const userAccounts = getAccounts(state, network.chainId).filter(
      (acc) => acc.publicKey !== '' || acc.deployTxnHash !== '',
    );
    logger.log(
      `getStoredUserAccounts: userAccounts:\n${toJson(userAccounts, 2)}`,
    );

    return userAccounts;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
