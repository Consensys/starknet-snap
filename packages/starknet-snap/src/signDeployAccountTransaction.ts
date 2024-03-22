import { toJson } from './utils/serializer';
import { Signature } from 'starknet';
import { ApiParams, SignDeployAccountTransactionRequestParams } from './types/snapApi';
import {
  getKeysFromAddress,
  signDeployAccountTransaction as signDeployAccountTransactionUtil,
} from './utils/starknetUtils';
import { getNetworkFromChainId, getSignTxnTxt } from './utils/snapUtils';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel } from '@metamask/snaps-sdk';
import { logger } from '../src/utils/logger';

export async function signDeployAccountTransaction(params: ApiParams): Promise<Signature | boolean> {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as SignDeployAccountTransactionRequestParams;
    const signerAddress = requestParamsObj.signerAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey } = await getKeysFromAddress(keyDeriver, network, state, signerAddress);

    logger.log(`signDeployAccountTransaction params: ${toJson(requestParamsObj.transaction, 2)}}`);

    const snapComponents = getSignTxnTxt(signerAddress, network, requestParamsObj.transaction);

    if (requestParamsObj.enableAutherize === true) {
      const response = await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Confirmation,
          content: panel([heading('Do you want to sign this transaction?'), ...snapComponents]),
        },
      });

      if (!response) return false;
    }

    return await signDeployAccountTransactionUtil(privateKey, requestParamsObj.transaction);
  } catch (error) {
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
