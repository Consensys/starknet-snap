import typedDataExample from './typedData/typedDataExample.json';
import type {
  ApiParamsWithKeyDeriver,
  VerifySignedMessageRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  verifyIfAccountNeedUpgradeOrDeploy,
} from './utils/snapUtils';
import {
  verifyTypedDataMessageSignature,
  getFullPublicKeyPairFromPrivateKey,
  getKeysFromAddress,
  validateAndParseAddress,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function verifySignedMessage(params: ApiParamsWithKeyDeriver) {
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
        `The given signer address and signature need to be non-empty string, got: ${toJson(
          requestParamsObj,
        )}`,
      );
    }

    try {
      validateAndParseAddress(verifySignerAddress);
    } catch (error) {
      throw new Error(
        `The given signer address is invalid: ${verifySignerAddress}`,
      );
    }

    const { privateKey: signerPrivateKey, publicKey } =
      await getKeysFromAddress(keyDeriver, network, state, verifySignerAddress);

    await verifyIfAccountNeedUpgradeOrDeploy(
      network,
      verifySignerAddress,
      publicKey,
      false,
    );

    const fullPublicKey = getFullPublicKeyPairFromPrivateKey(signerPrivateKey);

    const isVerified = verifyTypedDataMessageSignature(
      fullPublicKey,
      verifyTypedDataMessage,
      verifySignerAddress,
      verifySignature,
    );

    logger.log(`verifySignedMessage:\nisVerified: ${isVerified}`);
    return isVerified;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
