import { toJson } from './utils/serializer';
import { ApiParams, SwitchNetworkRequestParams } from './types/snapApi';
import { getNetwork, setCurrentNetwork, getNetworkTxt } from './utils/snapUtils';
import { panel, heading, DialogType } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';

export async function switchNetwork(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, requestParams } = params;
    const requestParamsObj = requestParams as SwitchNetworkRequestParams;
    const network = getNetwork(state, requestParamsObj.chainId);
    if (!network) {
      throw new Error(`The given chainId is invalid: ${requestParamsObj.chainId}`);
    }
    const components = getNetworkTxt(network);

    if (requestParamsObj.enableAuthorize === true) {
      const response = await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Confirmation,
          content: panel([heading('Do you want to switch to this network?'), ...components]),
        },
      });
      if (!response) return false;
    }

    logger.log(`switchNetwork: network:\n${toJson(network, 2)}`);
    await setCurrentNetwork(network, wallet, saveMutex, state);

    return true;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
