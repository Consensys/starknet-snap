import { toJson } from './utils/serializer';
import { Signature } from 'starknet';
import { ApiParams, SignTransactionParams } from './types/snapApi';
import { getKeysFromAddress, signTransactions } from './utils/starknetUtils';
import { getNetworkFromChainId, getSignTxnTxt } from './utils/snapUtils';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel } from '@metamask/snaps-ui';
import { logger } from '../src/utils/logger';

export async function signTransaction(params: ApiParams): Promise<Signature | boolean> {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as SignTransactionParams;
    const userAddress = requestParamsObj.userAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey } = await getKeysFromAddress(keyDeriver, network, state, userAddress);

    logger.log(`signTransaction params: ${toJson(requestParamsObj.transactions, 2)}}`);

    const snapComponents = getSignTxnTxt(
      userAddress,
      network,
      requestParamsObj.transactions,
      requestParamsObj.transactionsDetail,
      requestParamsObj.abis,
    );

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([heading('Do you want to sign this transaction?'), ...snapComponents]),
      },
    });

    if (!response) return false;

    const signatures = await signTransactions(
      privateKey,
      requestParamsObj.transactions,
      requestParamsObj.transactionsDetail,
      requestParamsObj.abis,
    );

    return signatures;
  } catch (error) {
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
