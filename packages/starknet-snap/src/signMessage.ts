import { toJson } from './utils/serializer';
import typedDataExample from './typedData/typedDataExample.json';
import { getTypedDataMessageSignature, getKeysFromAddress } from './utils/starknetUtils';
import { getNetworkFromChainId } from './utils/snapUtils';
import { ApiParams, SignMessageRequestParams } from './types/snapApi';
import { validateAndParseAddress } from '../src/utils/starknetUtils';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel, copyable, text } from '@metamask/snaps-ui';
import { logger } from './utils/logger';

export async function signMessage(params: ApiParams) {
  try {
    const { state, wallet, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as SignMessageRequestParams;

    if (!requestParamsObj.signerAddress) {
      throw new Error(
        `The given signer address need to be non-empty string, got: ${toJson(requestParamsObj.signerAddress)}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.signerAddress);
    } catch (err) {
      throw new Error(`The given signer address is invalid: ${requestParamsObj.signerAddress}`);
    }

    const signerAddress = requestParamsObj.signerAddress;
    const typedDataMessage = requestParamsObj.typedDataMessage
      ? JSON.parse(requestParamsObj.typedDataMessage)
      : typedDataExample;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    logger.log(`signMessage:\nsignerAddress: ${signerAddress}\ntypedDataMessage: ${toJson(typedDataMessage)}`);

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([
          heading('Do you want to sign this message ?'),
          text(`**Message:**`),
          copyable(toJson(typedDataMessage)),
          text(`**Signer address:**`),
          copyable(`${signerAddress}`),
        ]),
      },
    });
    if (!response) return false;

    const { privateKey: signerPrivateKey } = await getKeysFromAddress(keyDeriver, network, state, signerAddress);

    const typedDataSignature = getTypedDataMessageSignature(signerPrivateKey, typedDataMessage, signerAddress);

    logger.log(`signMessage:\ntypedDataSignature: ${toJson(typedDataSignature)}`);
    return typedDataSignature.toDERHex();
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
