import typedDataExample from './typedData/typedDataExample.json';
import { verifyTypedDataMessageSignature,  getFullPublicKeyPairFromPrivateKey, getKeysFromAddress } from './utils/starknetUtils';
import { getNetworkFromChainId } from './utils/snapUtils';
import { ApiParams, VerifySignedMessageRequestParams } from './types/snapApi';
import { validateAndParseAddress } from 'starknet';

export async function verifySignedMessage(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as VerifySignedMessageRequestParams;

    if (!requestParamsObj.signerAddress || !requestParamsObj.signature) {
      throw new Error(
        `The given signer address and signature need to be non-empty string, got: ${JSON.stringify(requestParamsObj)}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.signerAddress);
    } catch (err) {
      throw new Error(`The given signer address is invalid: ${requestParamsObj.signerAddress}`);
    }

    const useOldAccounts = !!requestParamsObj.useOldAccounts;
    const verifySignerAddress = requestParamsObj.signerAddress;
    const verifySignature = requestParamsObj.signature.split(',').map((x) => x.trim());
    const verifyTypedDataMessage = requestParamsObj.typedDataMessage
      ? JSON.parse(requestParamsObj.typedDataMessage)
      : typedDataExample;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId, useOldAccounts);

    console.log(
      `verifySignedMessage:\nverifySignerAddress: ${verifySignerAddress}\nverifySignature: ${verifySignature}\nverifyTypedDataMessage: ${JSON.stringify(
        verifyTypedDataMessage,
      )}`,
    );

    const { privateKey: signerPrivateKey } = await getKeysFromAddress(keyDeriver, network, state, verifySignerAddress);
    
    const fullPublicKey = getFullPublicKeyPairFromPrivateKey(signerPrivateKey);

    const isVerified = verifyTypedDataMessageSignature(
      fullPublicKey,
      verifyTypedDataMessage,
      verifySignerAddress,
      verifySignature,
    );

    console.log(`verifySignedMessage:\nisVerified: ${isVerified}`);
    return isVerified;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
