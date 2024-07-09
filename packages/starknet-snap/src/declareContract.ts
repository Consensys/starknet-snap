import { toJson } from './utils/serializer';
import { ApiParams, DeclareContractRequestParams } from './types/snapApi';
import {
  getNetworkFromChainId,
  getDeclareSnapTxt,
  showUpgradeRequestModal,
  showDeployRequestModal,
} from './utils/snapUtils';
import {
  getKeysFromAddress,
  declareContract as declareContractUtil,
  getCorrectContractAddress,
} from './utils/starknetUtils';
import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';

export async function declareContract(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as DeclareContractRequestParams;

    logger.log(`executeTxn params: ${toJson(requestParamsObj, 2)}}`);

    const senderAddress = requestParamsObj.senderAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey, publicKey } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);

    const { upgradeRequired, deployRequired, address } = await getCorrectContractAddress(network, publicKey);

    if (upgradeRequired && deployRequired) {
      // Edge case force cairo0 deploy because non-zero balance
      await showDeployRequestModal(wallet);
      throw new Error(`Cairo 0 contract address ${address} balance is not empty, deploy required`);
    }

    if (upgradeRequired && !deployRequired) {
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
