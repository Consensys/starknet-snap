import { copyable, panel, text, DialogType } from '@metamask/snaps-sdk';

import type {
  ApiParamsWithKeyDeriver,
  ExtractPrivateKeyRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId } from './utils/snapUtils';
import {
  validateAndParseAddress,
  getKeysFromAddress,
  validateAccountRequireUpgradeOrDeploy,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function extractPrivateKey(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, wallet, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as ExtractPrivateKeyRequestParams;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { userAddress } = requestParamsObj;
    if (!userAddress) {
      throw new Error(
        `The given user address need to be non-empty string, got: ${toJson(
          userAddress,
        )}`,
      );
    }

    try {
      validateAndParseAddress(userAddress);
    } catch (error) {
      throw new Error(`The given user address is invalid: ${userAddress}`);
    }

    const { privateKey: userPrivateKey, publicKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      userAddress,
    );
    await validateAccountRequireUpgradeOrDeploy(
      network,
      userAddress,
      publicKey,
    );

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([text('Do you want to export your private Key ?')]),
      },
    });

    if (response === true) {
      await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Alert,
          content: panel([
            text('Starknet Account Private Key'),
            copyable(userPrivateKey),
          ]),
        },
      });
    }

    return null;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
