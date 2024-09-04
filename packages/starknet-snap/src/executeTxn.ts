import type { Component } from '@metamask/snaps-sdk';
import { heading, panel, divider, DialogType } from '@metamask/snaps-sdk';
import type { constants, Invocations } from 'starknet';
import { TransactionType } from 'starknet';

import type {
  ApiParamsWithKeyDeriver,
  ExecuteTxnRequestParams,
} from './types/snapApi';
import { ACCOUNT_CLASS_HASH, CAIRO_VERSION } from './utils/constants';
import { logger } from './utils/logger';
import {
  getNetworkFromChainId,
  getTxnSnapTxt,
  addDialogTxt,
  verifyIfAccountNeedUpgradeOrDeploy,
} from './utils/snapUtils';
import {
  getKeysFromAddress,
  executeTxn as executeTxnUtil,
  isAccountDeployed,
  estimateFeeBulk,
  getAccContractAddressAndCallData,
  addFeesFromAllTransactions,
  createAccount,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function executeTxn(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, keyDeriver, requestParams, wallet } = params;
    const requestParamsObj = requestParams as ExecuteTxnRequestParams;
    const { senderAddress: address, invocationsDetails } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey, publicKey, addressIndex } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      address,
    );

    await verifyIfAccountNeedUpgradeOrDeploy(network, address, publicKey);

    const txnInvocationArray = Array.isArray(requestParamsObj.txnInvocation)
      ? requestParamsObj.txnInvocation
      : [requestParamsObj.txnInvocation];
    const bulkTransactions: Invocations = txnInvocationArray.map((ele) => ({
      type: TransactionType.INVOKE,
      payload: ele,
    }));

    const accountDeployed = await isAccountDeployed(network, address);
    const version =
      invocationsDetails?.version as unknown as constants.TRANSACTION_VERSION;

    if (!accountDeployed) {
      const { callData } = getAccContractAddressAndCallData(publicKey);
      const deployAccountpayload = {
        classHash: ACCOUNT_CLASS_HASH,
        contractAddress: address,
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
      address,
      privateKey,
      bulkTransactions,
      invocationsDetails ?? undefined,
    );
    const estimateFeeResp = addFeesFromAllTransactions(fees);

    if (
      estimateFeeResp === undefined ||
      estimateFeeResp.suggestedMaxFee === undefined
    ) {
      throw new Error('Unable to estimate fees');
    }

    const maxFee = estimateFeeResp.suggestedMaxFee.toString(10);
    logger.log(`MaxFee: ${maxFee}`);

    let snapComponents: Component[] = [];
    if (!accountDeployed) {
      snapComponents.push(heading(`The account will be deployed`));
      addDialogTxt(snapComponents, 'Address', address);
      addDialogTxt(snapComponents, 'Public Key', publicKey);
      addDialogTxt(snapComponents, 'Address Index', addressIndex.toString());
      snapComponents.push(divider());
    }

    snapComponents = snapComponents.concat(
      getTxnSnapTxt(
        address,
        network,
        requestParamsObj.txnInvocation,
        requestParamsObj.abis,
        invocationsDetails,
      ),
    );

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([
          heading('Do you want to sign this transaction(s)?'),
          ...snapComponents,
        ]),
      },
    });
    if (!response) {
      return false;
    }

    if (!accountDeployed) {
      await createAccount({
        network,
        address,
        publicKey,
        privateKey,
        waitMode: true,
        callback: undefined,
        version,
      });
    }
    const nonceSendTransaction = accountDeployed ? undefined : 1;

    return await executeTxnUtil(
      network,
      address,
      privateKey,
      requestParamsObj.txnInvocation,
      requestParamsObj.abis,
      {
        ...invocationsDetails,
        maxFee,
        nonce: nonceSendTransaction,
      },
      CAIRO_VERSION,
    );
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
