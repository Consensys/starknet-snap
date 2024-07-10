import { toJson } from './utils/serializer';
import {
  signMessage as signMessageUtil,
  getKeysFromAddress,
  validateAndParseAddress,
  validateAccountRequireUpgradeOrDeploy,
  DeployRequiredError,
  UpgradeRequiredError,
} from './utils/starknetUtils';
import {
  getNetworkFromChainId,
  addDialogTxt,
  showUpgradeRequestModal,
  showDeployRequestModal,
} from './utils/snapUtils';
import { ApiParams, SignMessageRequestParams } from './types/snapApi';
import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';

export async function signMessage(params: ApiParams) {
  try {
    const { state, wallet, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as SignMessageRequestParams;
    const signerAddress = requestParamsObj.signerAddress;
    const typedDataMessage = requestParamsObj.typedDataMessage;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const { privateKey: signerPrivateKey, publicKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      signerAddress,
    );
    if (!signerAddress) {
      throw new Error(`The given signer address need to be non-empty string, got: ${toJson(signerAddress)}`);
    }

    try {
      await validateAccountRequireUpgradeOrDeploy(network, signerAddress, publicKey);
    } catch (e) {
            if (e instanceof DeployRequiredError) {
        await showDeployRequestModal(wallet);
      }
      if (e instanceof UpgradeRequiredError) {
        await showUpgradeRequestModal(wallet);
      }
      throw e;
    }

    logger.log(`signMessage:\nsignerAddress: ${signerAddress}\ntypedDataMessage: ${toJson(typedDataMessage)}`);

    try {
      validateAndParseAddress(signerAddress);
    } catch (err) {
      throw new Error(`The given signer address is invalid: ${signerAddress}`);
    }

    const components = [];
    addDialogTxt(components, 'Message', toJson(typedDataMessage));
    addDialogTxt(components, 'Signer Address', signerAddress);

    if (requestParamsObj.enableAuthorize === true) {
      const response = await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Confirmation,
          content: panel([heading('Do you want to sign this message?'), ...components]),
        },
      });

      if (!response) return false;
    }

    const typedDataSignature = signMessageUtil(signerPrivateKey, typedDataMessage, signerAddress);

    logger.log(`signMessage:\ntypedDataSignature: ${toJson(typedDataSignature)}`);

    return typedDataSignature;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
