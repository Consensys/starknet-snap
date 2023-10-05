import { toJson } from './utils/serializer';
import typedDataExample from './typedData/typedDataExample.json';
import { getTypedDataMessageSignature, getKeysFromAddress, isUpgradeRequired } from './utils/starknetUtils';
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
    const signerAddress = requestParamsObj.signerAddress;
    const typedDataMessage = requestParamsObj.typedDataMessage
      ? JSON.parse(requestParamsObj.typedDataMessage)
      : typedDataExample;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    logger.log(`signMessage:\nsignerAddress: ${signerAddress}\ntypedDataMessage: ${toJson(typedDataMessage)}`);

    if (!signerAddress) {
      throw new Error(`The given signer address need to be non-empty string, got: ${toJson(signerAddress)}`);
    }

    try {
      validateAndParseAddress(signerAddress);
    } catch (err) {
      throw new Error(`The given signer address is invalid: ${signerAddress}`);
    }

    if (await isUpgradeRequired(network, signerAddress)) {
      throw new Error('Upgrade required');
    }

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

    const result = typedDataSignature.toDERHex();

    logger.log(`signMessage:\ntypedDataSignature: ${result}`);

    return result;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
