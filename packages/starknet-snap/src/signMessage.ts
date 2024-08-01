import { heading, panel, DialogType } from '@metamask/snaps-sdk';

import type {
  ApiParamsWithKeyDeriver,
  SignMessageRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  addDialogTxt,
  verifyIfAccountNeedUpgradeOrDeploy,
} from './utils/snapUtils';
import {
  signMessage as signMessageUtil,
  getKeysFromAddress,
  validateAndParseAddress,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function signMessage(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, wallet, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as SignMessageRequestParams;
    const { signerAddress } = requestParamsObj;
    const { typedDataMessage } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    logger.log(
      `signMessage:\nsignerAddress: ${signerAddress}\ntypedDataMessage: ${toJson(
        typedDataMessage,
      )}`,
    );

    try {
      validateAndParseAddress(signerAddress);
    } catch (error) {
      throw new Error(`The given signer address is invalid: ${signerAddress}`);
    }

    const { privateKey: signerPrivateKey, publicKey } =
      await getKeysFromAddress(keyDeriver, network, state, signerAddress);
    if (!signerAddress) {
      throw new Error(
        `The given signer address need to be non-empty string, got: ${toJson(
          signerAddress,
        )}`,
      );
    }

    await verifyIfAccountNeedUpgradeOrDeploy(network, signerAddress, publicKey);

    const components = [];
    addDialogTxt(components, 'Message', toJson(typedDataMessage));
    addDialogTxt(components, 'Signer Address', signerAddress);

    if (requestParamsObj.enableAuthorize) {
      const response = await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Confirmation,
          content: panel([
            heading('Do you want to sign this message?'),
            ...components,
          ]),
        },
      });

      if (!response) {
        return false;
      }
    }

    const typedDataSignature = signMessageUtil(
      signerPrivateKey,
      typedDataMessage,
      signerAddress,
    );

    logger.log(
      `signMessage:\ntypedDataSignature: ${toJson(typedDataSignature)}`,
    );

    return typedDataSignature;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
