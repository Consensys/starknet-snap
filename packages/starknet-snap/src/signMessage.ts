import typedDataExample from './typedData/typedDataExample.json';
import { getTypedDataMessageSignature, getKeysFromAddress } from './utils/starknetUtils';
import { getNetworkFromChainId } from './utils/snapUtils';
import { ApiParams, SignMessageRequestParams } from './types/snapApi';
import { validateAndParseAddress } from 'starknet';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel, text } from '@metamask/snaps-ui';

export async function signMessage(params: ApiParams) {
  try {
    const { state, wallet, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as SignMessageRequestParams;

    if (!requestParamsObj.signerAddress) {
      throw new Error(
        `The given signer address need to be non-empty string, got: ${JSON.stringify(requestParamsObj.signerAddress)}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.signerAddress);
    } catch (err) {
      throw new Error(`The given signer address is invalid: ${requestParamsObj.signerAddress}`);
    }

    const signerAddress = requestParamsObj.signerAddress;
    const useOldAccounts = !!requestParamsObj.useOldAccounts;
    const typedDataMessage = requestParamsObj.typedDataMessage
      ? JSON.parse(requestParamsObj.typedDataMessage)
      : typedDataExample;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId, useOldAccounts);

    console.log(`signMessage:\nsignerAddress: ${signerAddress}\ntypedDataMessage: ${JSON.stringify(typedDataMessage)}`);

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([heading('Do you want to sign this message ?'), text(JSON.stringify(typedDataMessage))]),
      },
    });
    if (!response) return false;

    const { privateKey: signerPrivateKey } = await getKeysFromAddress(keyDeriver, network, state, signerAddress);

    const typedDataSignature = getTypedDataMessageSignature(signerPrivateKey, typedDataMessage, signerAddress);
    
    console.log(`signMessage:\ntypedDataSignature: ${typedDataSignature}`);
    return typedDataSignature;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
