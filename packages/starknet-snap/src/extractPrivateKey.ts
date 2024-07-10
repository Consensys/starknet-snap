import { toJson } from './utils/serializer';
import { getCorrectContractAddress, validateAccountRequireUpgradeOrDeploy, validateAndParseAddress } from '../src/utils/starknetUtils';
import { ApiParams, ExtractPrivateKeyRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import { getKeysFromAddress } from './utils/starknetUtils';
import { copyable, panel, text, DialogType } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';

export async function extractPrivateKey(params: ApiParams) {
  try {
    const { state, wallet, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as ExtractPrivateKeyRequestParams;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const userAddress = requestParamsObj.userAddress;
    if (!userAddress) {
      throw new Error(`The given user address need to be non-empty string, got: ${toJson(userAddress)}`);
    }

    try {
      validateAndParseAddress(userAddress);
    } catch (err) {
      throw new Error(`The given user address is invalid: ${userAddress}`);
    }

    const { privateKey: userPrivateKey, publicKey } = await getKeysFromAddress(keyDeriver, network, state, userAddress);
    await validateAccountRequireUpgradeOrDeploy(network,userAddress, publicKey);

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
          content: panel([text('Starknet Account Private Key'), copyable(userPrivateKey)]),
        },
      });
    }

    return null;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
