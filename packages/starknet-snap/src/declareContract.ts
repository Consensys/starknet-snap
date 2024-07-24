import { heading, panel, DialogType } from '@metamask/snaps-sdk';

import type { ApiParams, DeclareContractRequestParams } from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId, getDeclareSnapTxt, showAccountRequireUpgradeOrDeployModal } from './utils/snapUtils';
import {
  getKeysFromAddress,
  declareContract as declareContractUtil,
  validateAccountRequireUpgradeOrDeploy,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function declareContract(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as DeclareContractRequestParams;

    logger.log(`executeTxn params: ${toJson(requestParamsObj, 2)}}`);

    const { senderAddress } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey, publicKey } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);

    try {
      await validateAccountRequireUpgradeOrDeploy(network, senderAddress, publicKey);
    } catch (validateError) {
      await showAccountRequireUpgradeOrDeployModal(wallet, validateError);
      throw validateError;
    }

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
        content: panel([heading('Do you want to sign this transaction?'), ...snapComponents]),
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
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
