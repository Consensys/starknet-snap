import { toJson } from './utils/serializer';
import { getNetworkFromChainId, getValidNumber } from './utils/snapUtils';
import { AccContract } from './types/snapState';
import { ApiParams, RecoverAccountsRequestParams } from './types/snapApi';
import { logger } from './utils/logger';
import { AccountContractService, CairoOneContract, CairoZeroContract } from './services/accountContract';
import { AccountSnapStateService } from './services/account/snapState';
import { AccountKeyring } from './services/account';
import { NodeProvider } from './services/node';

export async function recoverAccounts(params: ApiParams) {
  try {
    const { state, wallet, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as RecoverAccountsRequestParams;

    const startIndex = getValidNumber(requestParamsObj.startScanIndex, 0, 0);
    const maxScanned = getValidNumber(requestParamsObj.maxScanned, 1, 1);
    const maxMissed = getValidNumber(requestParamsObj.maxMissed, 1, 1);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    logger.log(`recoverAccounts:\nstartIndex: ${startIndex}, maxScanned: ${maxScanned}, maxMissed: ${maxMissed}`);

    const provider = new NodeProvider(network);
    const snapStateService = new AccountSnapStateService(wallet, network);
    const contractService = new AccountContractService([CairoOneContract, CairoZeroContract], provider);
    const keyring = new AccountKeyring(keyDeriver, contractService, snapStateService);
    const scannedAccounts: AccContract[] = await keyring.addAccounts(startIndex, startIndex + maxScanned);

    logger.log(`recoverAccounts:\nscannedAccounts: ${toJson(scannedAccounts, 2)}`);

    return scannedAccounts;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
