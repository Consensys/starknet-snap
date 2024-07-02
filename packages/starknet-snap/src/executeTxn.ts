import { Invocations, TransactionType } from 'starknet';
import { getNetworkFromChainId, getTxnSnapTxt, addDialogTxt, showUpgradeRequestModal } from './utils/snapUtils';
import {
  getKeysFromAddress,
  executeTxn as executeTxnUtil,
  isAccountDeployed,
  estimateFeeBulk,
  getAccContractAddressAndCallData,
  addFeesFromAllTransactions,
  isUpgradeRequired,
} from './utils/starknetUtils';
import { ApiParams, ExecuteTxnRequestParams } from './types/snapApi';
import { createAccount } from './createAccount';
import { heading, panel, divider, DialogType } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';
import { ACCOUNT_CLASS_HASH } from './utils/constants';

export async function executeTxn(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as ExecuteTxnRequestParams;
    const senderAddress = requestParamsObj.senderAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const {
      privateKey: senderPrivateKey,
      publicKey,
      addressIndex,
    } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);

    if (await isUpgradeRequired(network, senderAddress)) {
      await showUpgradeRequestModal(wallet);
      throw new Error('Upgrade required');
    }

    const txnInvocationArray = Array.isArray(requestParamsObj.txnInvocation)
      ? requestParamsObj.txnInvocation
      : [requestParamsObj.txnInvocation];
    const bulkTransactions: Invocations = txnInvocationArray.map((ele) => ({
      type: TransactionType.INVOKE,
      payload: ele,
    }));
    const accountDeployed = await isAccountDeployed(network, senderAddress);
    if (!accountDeployed) {
      const { callData } = getAccContractAddressAndCallData(publicKey);
      const deployAccountpayload = {
        classHash: ACCOUNT_CLASS_HASH,
        contractAddress: senderAddress,
        constructorCalldata: callData,
        addressSalt: publicKey,
      };

      bulkTransactions.unshift({
        type: TransactionType.DEPLOY_ACCOUNT,
        payload: deployAccountpayload,
      });
    }

    const fees = await estimateFeeBulk(
      network,
      senderAddress,
      senderPrivateKey,
      bulkTransactions,
      requestParamsObj.invocationsDetails ? requestParamsObj.invocationsDetails : undefined,
    );
    const estimateFeeResp = addFeesFromAllTransactions(fees);

    const maxFee = estimateFeeResp.suggestedMaxFee.toString(10);
    logger.log(`MaxFee: ${maxFee}`);

    let snapComponents = [];
    let createAccountApiParams: ApiParams;
    if (!accountDeployed) {
      snapComponents.push(heading(`The account will be deployed`));
      addDialogTxt(snapComponents, 'Address', senderAddress);
      addDialogTxt(snapComponents, 'Public Key', publicKey);
      addDialogTxt(snapComponents, 'Address Index', addressIndex.toString());
      snapComponents.push(divider());
      createAccountApiParams = {
        state,
        wallet: params.wallet,
        saveMutex: params.saveMutex,
        keyDeriver,
        requestParams: {
          addressIndex,
          deploy: true,
          chainId: requestParamsObj.chainId,
        },
      } as ApiParams;
    }

    snapComponents = snapComponents.concat(
      getTxnSnapTxt(
        senderAddress,
        network,
        requestParamsObj.txnInvocation,
        requestParamsObj.abis,
        requestParamsObj.invocationsDetails,
      ),
    );

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([heading('Do you want to sign this transaction(s)?'), ...snapComponents]),
      },
    });
    if (!response) return false;

    if (!accountDeployed) {
      await createAccount(createAccountApiParams, true, true);
    }
    const nonceSendTransaction = accountDeployed ? undefined : 1;

    return await executeTxnUtil(
      network,
      senderAddress,
      senderPrivateKey,
      requestParamsObj.txnInvocation,
      requestParamsObj.abis,
      { maxFee, nonce: nonceSendTransaction },
    );
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
