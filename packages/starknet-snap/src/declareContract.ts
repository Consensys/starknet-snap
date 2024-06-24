import { toJson } from './utils/serializer';
import { ApiParams, DeclareContractRequestParams } from './types/snapApi';
import { getNetworkFromChainId, getDeclareSnapTxt, showUpgradeRequestModal } from './utils/snapUtils';
import { getKeysFromAddress, declareContract as declareContractUtil, isUpgradeRequired } from './utils/starknetUtils';
import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';

export async function declareContract(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as DeclareContractRequestParams;

    logger.log(`executeTxn params: ${toJson(requestParamsObj, 2)}}`);

    const senderAddress = requestParamsObj.senderAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);

    if (await isUpgradeRequired(network, senderAddress)) {
      await showUpgradeRequestModal(wallet);
      throw new Error('Upgrade required');
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

    if (!response) return false;

    return await declareContractUtil(
      network,
      senderAddress,
      privateKey,
      requestParamsObj.contractPayload,
      requestParamsObj.invocationsDetails,
    );
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
