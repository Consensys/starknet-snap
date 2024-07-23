import { heading, panel, DialogType } from '@metamask/snaps-sdk';

import type { ApiParams, SignMessageRequestParams } from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId, addDialogTxt, showUpgradeRequestModal } from './utils/snapUtils';
import {
  signMessage as signMessageUtil,
  getKeysFromAddress,
  isUpgradeRequired,
  validateAndParseAddress,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function signMessage(params: ApiParams) {
  try {
    const { state, wallet, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as SignMessageRequestParams;
    const { signerAddress } = requestParamsObj;
    const { typedDataMessage } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    if (await isUpgradeRequired(network, signerAddress)) {
      await showUpgradeRequestModal(wallet);
      throw new Error('Upgrade required');
    }

    logger.log(`signMessage:\nsignerAddress: ${signerAddress}\ntypedDataMessage: ${toJson(typedDataMessage)}`);

    if (!signerAddress) {
      throw new Error(`The given signer address need to be non-empty string, got: ${toJson(signerAddress)}`);
    }

    try {
      validateAndParseAddress(signerAddress);
    } catch (error) {
      throw new Error(`The given signer address is invalid: ${signerAddress}`);
    }

    if (await isUpgradeRequired(network, signerAddress)) {
      throw new Error('Upgrade required');
    }

    const components = [];
    addDialogTxt(components, 'Message', toJson(typedDataMessage));
    addDialogTxt(components, 'Signer Address', signerAddress);

    if (requestParamsObj.enableAuthorize) {
      const response = await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Confirmation,
          content: panel([heading('Do you want to sign this message?'), ...components]),
        },
      });

      if (!response) {
        return false;
      }
    }

    const { privateKey: signerPrivateKey } = await getKeysFromAddress(keyDeriver, network, state, signerAddress);

    const typedDataSignature = signMessageUtil(signerPrivateKey, typedDataMessage, signerAddress);

    logger.log(`signMessage:\ntypedDataSignature: ${toJson(typedDataSignature)}`);

    return typedDataSignature;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
