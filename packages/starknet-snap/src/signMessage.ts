import typedDataExample from './typedData/typedDataExample.json';
import { getTypedDataMessageSignature, getKeyPairFromPrivateKey, getKeysFromAddress } from './utils/starknetUtils';
import { getNetworkFromChainId } from './utils/snapUtils';
import { ApiParams, SignMessageRequestParams } from './types/snapApi';
import { validateAndParseAddress } from 'starknet';

export async function signMessage(params: ApiParams) {
  try {
    const { state, wallet, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as SignMessageRequestParams;

    const response = await wallet.request({
      method: 'snap_confirm',
      params: [
        {
          prompt: `Do you want to sign this message ?`,
          textAreaContent: `${JSON.stringify(requestParamsObj.typedDataMessage)}`,
        },
      ],
    });
    if (!response) return false;

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

    const { privateKey: signerPrivateKey } = await getKeysFromAddress(keyDeriver, network, state, signerAddress);
    const signerKeyPair = getKeyPairFromPrivateKey(signerPrivateKey);
    const typedDataSignature = getTypedDataMessageSignature(signerKeyPair, typedDataMessage, signerAddress);

    console.log(`signMessage:\ntypedDataSignature: ${typedDataSignature}`);
    return typedDataSignature;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
