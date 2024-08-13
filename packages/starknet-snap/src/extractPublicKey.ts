import { constants, num as numUtils } from 'starknet';

import type {
  ApiParamsWithKeyDeriver,
  ExtractPublicKeyRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getAccount,
  getNetworkFromChainId,
  verifyIfAccountNeedUpgradeOrDeploy,
} from './utils/snapUtils';
import {
  validateAndParseAddress,
  getKeysFromAddress,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function extractPublicKey(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as ExtractPublicKeyRequestParams;

    const { userAddress } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    if (!requestParamsObj.userAddress) {
      throw new Error(
        `The given user address need to be non-empty string, got: ${toJson(
          requestParamsObj.userAddress,
        )}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.userAddress);
    } catch (error) {
      throw new Error(
        `The given user address is invalid: ${requestParamsObj.userAddress}`,
      );
    }

    // [TODO] logic below is redundant, getKeysFromAddress is doing the same
    const { publicKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      userAddress,
    );

    await verifyIfAccountNeedUpgradeOrDeploy(
      network,
      userAddress,
      publicKey,
      false,
    );

    let userPublicKey;
    const accContract = getAccount(state, userAddress, network.chainId);
    if (
      !accContract?.publicKey ||
      numUtils.toBigInt(accContract.publicKey) === constants.ZERO
    ) {
      logger.log(
        `extractPublicKey: User address cannot be found or the signer public key is 0x0: ${userAddress}`,
      );
      userPublicKey = publicKey;
    } else {
      userPublicKey = accContract.publicKey;
    }
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.log(`extractPublicKey:\nuserPublicKey: ${userPublicKey}`);

    return userPublicKey;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
