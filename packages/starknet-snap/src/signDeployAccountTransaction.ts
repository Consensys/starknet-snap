import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import type { Signature } from 'starknet';

import type {
  ApiParamsWithKeyDeriver,
  SignDeployAccountTransactionRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  getSignTxnTxt,
  verifyIfAccountNeedUpgradeOrDeploy,
} from './utils/snapUtils';
import {
  getKeysFromAddress,
  signDeployAccountTransaction as signDeployAccountTransactionUtil,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function signDeployAccountTransaction(
  params: ApiParamsWithKeyDeriver,
): Promise<Signature | boolean> {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj =
      requestParams as SignDeployAccountTransactionRequestParams;
    const { signerAddress } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey, publicKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      signerAddress,
    );

    await verifyIfAccountNeedUpgradeOrDeploy(network, signerAddress, publicKey);

    logger.log(
      `signDeployAccountTransaction params: ${toJson(
        requestParamsObj.transaction,
        2,
      )}}`,
    );

    const snapComponents = getSignTxnTxt(
      signerAddress,
      network,
      requestParamsObj.transaction,
    );

    if (requestParamsObj.enableAuthorize) {
      const response = await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Confirmation,
          content: panel([
            heading('Do you want to sign this transaction?'),
            ...snapComponents,
          ]),
        },
      });

      if (!response) {
        return false;
      }
    }

    return await signDeployAccountTransactionUtil(
      privateKey,
      requestParamsObj.transaction,
    );
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
