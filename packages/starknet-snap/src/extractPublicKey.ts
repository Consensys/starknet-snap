import { constants, num as numUtils } from 'starknet';

import type { ApiParams, ExtractPublicKeyRequestParams } from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getAccount, getNetworkFromChainId } from './utils/snapUtils';
import { validateAndParseAddress, isUpgradeRequired, getKeysFromAddress } from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function extractPublicKey(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as ExtractPublicKeyRequestParams;

    const { userAddress } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    if (!requestParamsObj.userAddress) {
      throw new Error(
        `The given user address need to be non-empty string, got: ${toJson(requestParamsObj.userAddress)}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.userAddress);
    } catch (error) {
      throw new Error(`The given user address is invalid: ${requestParamsObj.userAddress}`);
    }

    if (await isUpgradeRequired(network, userAddress)) {
      throw new Error('Upgrade required');
    }

    let userPublicKey;
    const accContract = getAccount(state, userAddress, network.chainId);
    if (!accContract?.publicKey || numUtils.toBigInt(accContract.publicKey) === constants.ZERO) {
      logger.log(`extractPublicKey: User address cannot be found or the signer public key is 0x0: ${userAddress}`);
      const { publicKey } = await getKeysFromAddress(keyDeriver, network, state, userAddress);
      userPublicKey = publicKey;
    } else {
      userPublicKey = accContract.publicKey;
    }
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.log(`extractPublicKey:\nuserPublicKey: ${userPublicKey}`);

    return userPublicKey;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
