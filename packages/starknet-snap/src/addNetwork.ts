import { panel, heading, DialogType } from '@metamask/snaps-sdk';

import type { AddNetworkRequestParams, ApiParams } from './types/snapApi';
import type { Network } from './types/snapState';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { validateAddNetworkParams, upsertNetwork, getNetworkTxt } from './utils/snapUtils';

/**
 *
 * @param params
 */
export async function addNetwork(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, requestParams } = params;
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

    const network = {
      name: requestParamsObj.networkName,
      chainId: requestParamsObj.networkChainId,
      baseUrl: requestParamsObj.networkBaseUrl,
      nodeUrl: requestParamsObj.networkNodeUrl,
      voyagerUrl: requestParamsObj.networkVoyagerUrl,
    } as Network;

    const components = getNetworkTxt(network);

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([heading('Do you want to add this network?'), ...components]),
      },
    });
    if (!response) {
      return false;
    }

    await upsertNetwork(network, wallet, saveMutex, state);

    return true;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
