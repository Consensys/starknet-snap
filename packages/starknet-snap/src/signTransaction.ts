import { heading } from '@metamask/snaps-sdk';
import type { Signature } from 'starknet';

import type {
  ApiParamsWithKeyDeriver,
  SignTransactionRequestParams,
} from './types/snapApi';
import { confirmDialog } from './utils';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  getSignTxnTxt,
  verifyIfAccountNeedUpgradeOrDeploy,
} from './utils/snapUtils';
import { getKeysFromAddress, signTransactions } from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function signTransaction(
  params: ApiParamsWithKeyDeriver,
): Promise<Signature | boolean> {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as SignTransactionRequestParams;
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
      `signTransaction params: ${toJson(requestParamsObj.transactions, 2)}}`,
    );

    const snapComponents = getSignTxnTxt(
      signerAddress,
      network,
      requestParamsObj.transactions,
    );

    if (requestParamsObj.enableAuthorize) {
      await confirmDialog([
        heading('Do you want to sign this transaction?'),
        ...snapComponents,
      ]);
    }

    const signatures = await signTransactions(
      privateKey,
      requestParamsObj.transactions,
      requestParamsObj.transactionsDetail,
    );

    return signatures;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
