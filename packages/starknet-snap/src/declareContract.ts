import { heading, panel, DialogType } from '@metamask/snaps-sdk';

import type {
  ApiParamsWithKeyDeriver,
  DeclareContractRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  getDeclareSnapTxt,
  verifyIfAccountNeedUpgradeOrDeploy,
} from './utils/snapUtils';
import {
  getKeysFromAddress,
  declareContract as declareContractUtil,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function declareContract(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;

    const requestParamsObj = requestParams as DeclareContractRequestParams;

    logger.log(`executeTxn params: ${toJson(requestParamsObj, 2)}}`);

    const { senderAddress } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey, publicKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      senderAddress,
    );

    await verifyIfAccountNeedUpgradeOrDeploy(network, senderAddress, publicKey);

    const snapComponents = getDeclareSnapTxt(
      senderAddress,
      network,
      requestParamsObj.contractPayload,
      requestParamsObj.invocationsDetails,
    );

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([
          heading('Do you want to sign this transaction?'),
          ...snapComponents,
        ]),
      },
    });

    if (!response) {
      return false;
    }

    return await declareContractUtil(
      network,
      senderAddress,
      privateKey,
      requestParamsObj.contractPayload,
      requestParamsObj.invocationsDetails,
    );
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
