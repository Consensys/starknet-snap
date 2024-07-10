import { toJson } from './utils/serializer';
import typedDataExample from './typedData/typedDataExample.json';
import {
  verifyTypedDataMessageSignature,
  getFullPublicKeyPairFromPrivateKey,
  getKeysFromAddress,
  getCorrectContractAddress,
  validateAccountRequireUpgradeOrDeploy,
} from './utils/starknetUtils';
import { getNetworkFromChainId } from './utils/snapUtils';
import { ApiParams, VerifySignedMessageRequestParams } from './types/snapApi';
import { logger } from './utils/logger';
import { validateAndParseAddress } from '../src/utils/starknetUtils';

export async function verifySignedMessage(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as VerifySignedMessageRequestParams;
    const verifySignerAddress = requestParamsObj.signerAddress;
    const verifySignature = requestParamsObj.signature;
    const verifyTypedDataMessage = requestParamsObj.typedDataMessage
      ? JSON.parse(requestParamsObj.typedDataMessage)
      : typedDataExample;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    logger.log(
      `verifySignedMessage:\nverifySignerAddress: ${verifySignerAddress}\nverifySignature: ${verifySignature}\nverifyTypedDataMessage: ${toJson(
        verifyTypedDataMessage,
      )}`,
    );

    if (!verifySignerAddress || !verifySignature) {
      throw new Error(
        `The given signer address and signature need to be non-empty string, got: ${toJson(requestParamsObj)}`,
      );
    }

    try {
      validateAndParseAddress(verifySignerAddress);
    } catch (err) {
      throw new Error(`The given signer address is invalid: ${verifySignerAddress}`);
    }

    const { privateKey: signerPrivateKey, publicKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      verifySignerAddress,
    );
    await validateAccountRequireUpgradeOrDeploy(network,verifySignerAddress, publicKey);

    const fullPublicKey = getFullPublicKeyPairFromPrivateKey(signerPrivateKey);

    const isVerified = verifyTypedDataMessageSignature(
      fullPublicKey,
      verifyTypedDataMessage,
      verifySignerAddress,
      verifySignature,
    );

    logger.log(`verifySignedMessage:\nisVerified: ${isVerified}`);
    return isVerified;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
