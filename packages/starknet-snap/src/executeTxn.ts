import { toJson } from './utils/serializer';
import { CallDetails } from 'starknet';
import { getNetworkFromChainId, getTxnSnapTxt, addDialogTxt } from './utils/snapUtils';
import { getKeysFromAddress, executeTxn as executeTxnUtil, isAccountDeployed } from './utils/starknetUtils';
import { ApiParams, EstimateFeeRequestParams, ExecuteTxnRequestParams } from './types/snapApi';
import { createAccount } from './createAccount';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel, text, divider } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';
import { estimateFee } from './estimateFee';

export async function executeTxn(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as ExecuteTxnRequestParams;
    const requestParamsObjEstimateFee = requestParams as EstimateFeeRequestParams;

    const txnInvocation = (
      (requestParamsObj.txnInvocation as CallDetails).calldata
        ? requestParamsObj.txnInvocation
        : requestParamsObj.txnInvocation[0]
    ) as CallDetails;

    requestParamsObjEstimateFee.senderAddress = requestParamsObj.senderAddress;
    requestParamsObjEstimateFee.contractAddress = txnInvocation.contractAddress;
    requestParamsObjEstimateFee.contractFuncName = txnInvocation.entrypoint;
    requestParamsObjEstimateFee.contractCallData = (txnInvocation.calldata as String[]).join(',');

    logger.log(`executeTxn params: ${toJson(requestParamsObj, 2)}`);
    const estimateFeeResp = await estimateFee({ ...params, ...requestParamsObjEstimateFee });

    const senderAddress = requestParamsObj.senderAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const {
      privateKey: senderPrivateKey,
      publicKey,
      addressIndex,
    } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);
    const accountDeployed = await isAccountDeployed(network, publicKey);
    const maxFee = estimateFeeResp.suggestedMaxFee.toString(10);

    let snapComponents = [];
    let createAccountApiParams: ApiParams;
    if (!accountDeployed) {
      snapComponents.push(heading(`The account will be deployed`));
      const components = [];
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
      await createAccount(createAccountApiParams, true, false);
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
