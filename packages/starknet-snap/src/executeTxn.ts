import { toJson } from './utils/serializer';
import { getNetworkFromChainId, getTxnSnapTxt } from './utils/snapUtils';
import { getKeysFromAddress, executeTxn as executeTxnUtil } from './utils/starknetUtils';
import { ApiParams, ExecuteTxnRequestParams } from './types/snapApi';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';

export async function executeTxn(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as ExecuteTxnRequestParams;

    logger.log(`executeTxn params: ${toJson(requestParamsObj, 2)}}`);

    const senderAddress = requestParamsObj.senderAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey: senderPrivateKey } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);

    const snapComponents = getTxnSnapTxt(
      senderAddress,
      network,
      requestParamsObj.txnInvocation,
      requestParamsObj.abis,
      requestParamsObj.invocationsDetails,
    );

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([heading('Do you want to sign this transaction(s)?'), ...snapComponents]),
      },
    });

    if (!response) return false;

    return await executeTxnUtil(
      network,
      senderAddress,
      senderPrivateKey,
      requestParamsObj.txnInvocation,
      requestParamsObj.abis,
      requestParamsObj.invocationsDetails,
    );
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
