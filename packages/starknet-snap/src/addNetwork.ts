import { toJson } from './utils/serializer';
import { AddNetworkRequestParams, ApiParams } from './types/snapApi';
import { validateAddNetworkParams } from './utils/snapUtils';
import { logger } from './utils/logger';

export async function addNetwork(params: ApiParams) {
  try {
    const { requestParams } = params;
    const requestParamsObj = requestParams as AddNetworkRequestParams;

    if (
      !requestParamsObj.networkName ||
      !requestParamsObj.networkChainId ||
      !(requestParamsObj.networkBaseUrl || requestParamsObj.networkNodeUrl)
    ) {
      throw new Error(
        `The given contract network name, network chain id, and either network base URL or node URL need to be non-empty string, got: ${toJson(
          requestParamsObj,
        )}`,
      );
    }

    validateAddNetworkParams(requestParamsObj);

    throw new Error('addNetwork is currently disabled');
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
