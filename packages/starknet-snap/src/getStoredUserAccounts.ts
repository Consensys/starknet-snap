import { toJson } from './utils/serializer';
import { ApiParams, GetStoredUserAccountsRequestParams } from './types/snapApi';
import { getAccounts, getNetworkFromChainId } from './utils/snapUtils';

export async function getStoredUserAccounts(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetStoredUserAccountsRequestParams;

    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    // Only return the initialized or deploy-pending accounts
    const userAccounts = getAccounts(state, network.chainId).filter(
      (acc) => acc.publicKey !== '' || acc.deployTxnHash !== '',
    );
    console.log(`getStoredUserAccounts: userAccounts:\n${toJson(userAccounts, 2)}`);

    return userAccounts;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
