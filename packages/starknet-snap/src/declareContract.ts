import { toJson } from './utils/serializer';
import { ApiParams, DeclareContractRequestParams } from './types/snapApi';
import { getNetworkFromChainId, getDeclareSnapTxt } from './utils/snapUtils';
import { getKeysFromAddress, declareContract as declareContractUtil } from './utils/starknetUtils';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';

export async function declareContract(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as DeclareContractRequestParams;
    
    logger.log(`executeTxn params: ${toJson(requestParamsObj, 2)}}`);
    console.log("hello1")
    const senderAddress = requestParamsObj.senderAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    console.log("hello2")
    const { privateKey } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);
    console.log("hello3")
    const snapComponents = getDeclareSnapTxt(
      senderAddress,
      network,
      requestParamsObj.contractPayload,
      requestParamsObj.invocationsDetails,
    );
    console.log("hello4")
    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([heading('Do you want to sign this transaction?'), ...snapComponents]),
      },
    });

    if (!response) return false;

    return await declareContractUtil(
      network,
      senderAddress,
      privateKey,
      requestParamsObj.contractPayload,
      requestParamsObj.invocationsDetails,
    );
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
