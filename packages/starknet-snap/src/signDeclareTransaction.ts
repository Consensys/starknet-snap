import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import type { Signature } from 'starknet';

import type {
  ApiParamsWithKeyDeriver,
  SignDeclareTransactionRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  getSignTxnTxt,
  showAccountRequireUpgradeOrDeployModal,
} from './utils/snapUtils';
import {
  getKeysFromAddress,
  signDeclareTransaction as signDeclareTransactionUtil,
  validateAccountRequireUpgradeOrDeploy,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function signDeclareTransaction(
  params: ApiParamsWithKeyDeriver,
): Promise<Signature | boolean> {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj =
      requestParams as SignDeclareTransactionRequestParams;
    const { signerAddress } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey, publicKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      signerAddress,
    );

    try {
      await validateAccountRequireUpgradeOrDeploy(
        network,
        signerAddress,
        publicKey,
      );
    } catch (validateError) {
      await showAccountRequireUpgradeOrDeployModal(wallet, validateError);
      throw validateError;
    }

    logger.log(
      `signDeclareTransaction params: ${toJson(
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

    return await signDeclareTransactionUtil(
      privateKey,
      requestParamsObj.transaction,
    );
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
