import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import type { Signature } from 'starknet';

import type { ApiParams, SignTransactionRequestParams } from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId, getSignTxnTxt, showUpgradeRequestModal } from './utils/snapUtils';
import { getKeysFromAddress, signTransactions, isUpgradeRequired } from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function signTransaction(params: ApiParams): Promise<Signature | boolean> {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as SignTransactionRequestParams;
    const { signerAddress } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey } = await getKeysFromAddress(keyDeriver, network, state, signerAddress);

    if (await isUpgradeRequired(network, signerAddress)) {
      await showUpgradeRequestModal(wallet);
      throw new Error('Upgrade required');
    }

    logger.log(`signTransaction params: ${toJson(requestParamsObj.transactions, 2)}}`);

    const snapComponents = getSignTxnTxt(signerAddress, network, requestParamsObj.transactions);

    if (requestParamsObj.enableAuthorize) {
      const response = await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Confirmation,
          content: panel([heading('Do you want to sign this transaction?'), ...snapComponents]),
        },
      });

      if (!response) {
        return false;
      }
    }

    const signatures = await signTransactions(
      privateKey,
      requestParamsObj.transactions,
      requestParamsObj.transactionsDetail,
    );

    return signatures;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
