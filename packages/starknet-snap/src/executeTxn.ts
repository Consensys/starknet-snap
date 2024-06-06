import { toJson } from './utils/serializer';
import { getNetworkFromChainId, getTxnSnapTxt, showUpgradeRequestModal } from './utils/snapUtils';
import { getKeysFromAddress, executeTxn as executeTxnUtil, isAccountDeployed, isUpgradeRequired, getPermutationAddresses, getCorrectContractAddress } from './utils/starknetUtils';
import { ApiParams, ExecuteTxnRequestParams } from './types/snapApi';
import { createAccount } from './createAccount';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel, text } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';

export async function executeTxn(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as ExecuteTxnRequestParams;

    logger.log(`executeTxn params: ${toJson(requestParamsObj, 2)}}`);

    const senderAddress = requestParamsObj.senderAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { 
      privateKey: senderPrivateKey,
      publicKey,
      addressIndex,
    } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);

    const {upgradeRequired} = await getCorrectContractAddress(network, publicKey);
    if(upgradeRequired){
      showUpgradeRequestModal(wallet);
      return false;
    }

    const accountDeployed = await isAccountDeployed(network, senderAddress);
    if (!accountDeployed) {
      const response = await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Confirmation,
          content: panel([
            heading('Account Deployment Required'),
            text(`We need to deploy your account together with your first transaction.`),
          ]),
        },
      });
      if (!response) return false;
      const createAccountApiParams = {
        state,
        wallet: params.wallet,
        saveMutex: params.saveMutex,
        keyDeriver,
        requestParams: {
          addressIndex,
          deploy: true,
          chainId: requestParamsObj.chainId,
        },
      };
      await createAccount(createAccountApiParams, true);
    }

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
    //In case this is the first transaction we assign a nonce of 1 to make sure it does after the deploy transaction
    const nonceSendTransaction = accountDeployed ? undefined : 1;
    return await executeTxnUtil(
      network,
      senderAddress,
      senderPrivateKey,
      requestParamsObj.txnInvocation,
      requestParamsObj.abis,
      {
        ...requestParamsObj.invocationsDetails,
        nonce: nonceSendTransaction
      },
    );
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
