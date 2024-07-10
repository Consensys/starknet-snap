import { toJson } from './utils/serializer';
import { Signature } from 'starknet';
import { ApiParams, SignTransactionRequestParams } from './types/snapApi';
import {
  getKeysFromAddress,
  signTransactions,
  validateAccountRequireUpgradeOrDeploy,
  DeployRequiredError,
  UpgradeRequiredError,
} from './utils/starknetUtils';
import {
  getNetworkFromChainId,
  getSignTxnTxt,
  showDeployRequestModal,
  showUpgradeRequestModal,
} from './utils/snapUtils';
import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import { logger } from '../src/utils/logger';

export async function signTransaction(params: ApiParams): Promise<Signature | boolean> {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as SignTransactionRequestParams;
    const signerAddress = requestParamsObj.signerAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey, publicKey } = await getKeysFromAddress(keyDeriver, network, state, signerAddress);

    try {
      await validateAccountRequireUpgradeOrDeploy(network, signerAddress, publicKey);
    } catch (e) {
      if (e instanceof DeployRequiredError) {
        await showDeployRequestModal(wallet);
      }
      if (e instanceof UpgradeRequiredError) {
        await showUpgradeRequestModal(wallet);
      }
      throw e;
    }

    logger.log(`signTransaction params: ${toJson(requestParamsObj.transactions, 2)}}`);

    const snapComponents = getSignTxnTxt(signerAddress, network, requestParamsObj.transactions);

    if (requestParamsObj.enableAuthorize === true) {
      const response = await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Confirmation,
          content: panel([heading('Do you want to sign this transaction?'), ...snapComponents]),
        },
      });

      if (!response) return false;
    }

    const signatures = await signTransactions(
      privateKey,
      requestParamsObj.transactions,
      requestParamsObj.transactionsDetail,
    );

    return signatures;
  } catch (error) {
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
