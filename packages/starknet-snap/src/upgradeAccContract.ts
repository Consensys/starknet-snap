import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import { num as numUtils, constants, CallData } from 'starknet';

import type {
  ApiParamsWithKeyDeriver,
  UpgradeTransactionRequestParams,
} from './types/snapApi';
import { ContractFuncName } from './types/snapState';
import { ACCOUNT_CLASS_HASH, CAIRO_VERSION_LEGACY } from './utils/constants';
import { getTranslator } from './utils/locale';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  upsertTransaction,
  getSendTxnText,
} from './utils/snapUtils';
import {
  getKeysFromAddress,
  validateAndParseAddress,
  isUpgradeRequired,
  executeTxn,
  isAccountDeployed,
  estimateFee,
} from './utils/starknetUtils';
import { newInvokeTransaction } from './utils/transaction';

/**
 *
 * @param params
 */
export async function upgradeAccContract(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as UpgradeTransactionRequestParams;
    const { contractAddress } = requestParamsObj;
    const { chainId } = requestParamsObj;

    if (!contractAddress) {
      throw new Error(
        `The given contract address need to be non-empty string, got: ${toJson(
          requestParamsObj,
        )}`,
      );
    }
    try {
      validateAndParseAddress(contractAddress);
    } catch (error) {
      throw new Error(
        `The given contract address is invalid: ${contractAddress}`,
      );
    }

    const network = getNetworkFromChainId(state, chainId);

    if (!(await isAccountDeployed(network, contractAddress))) {
      throw new Error('Contract has not deployed');
    }

    if (!(await isUpgradeRequired(network, contractAddress))) {
      throw new Error('Upgrade is not required');
    }

    const { privateKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      contractAddress,
    );

    const method = ContractFuncName.Upgrade;

    const calldata = CallData.compile({
      implementation: ACCOUNT_CLASS_HASH,
      calldata: [0],
    });

    const txnInvocation = {
      contractAddress,
      entrypoint: method,
      calldata,
    };

    let maxFee = requestParamsObj.maxFee
      ? numUtils.toBigInt(requestParamsObj.maxFee)
      : constants.ZERO;
    if (maxFee === constants.ZERO) {
      const estFeeResp = await estimateFee(
        network,
        contractAddress,
        privateKey,
        txnInvocation,
        CAIRO_VERSION_LEGACY,
      );
      maxFee = numUtils.toBigInt(
        estFeeResp.suggestedMaxFee.toString(10) ?? '0',
      );
    }

    const dialogComponents = getSendTxnText(
      state,
      contractAddress,
      method,
      calldata,
      contractAddress,
      maxFee,
      network,
    );
    const translate = getTranslator();
    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([
          heading(translate('signTransactionPrompt')),
          ...dialogComponents,
        ]),
      },
    });

    if (!response) {
      return false;
    }

    logger.log(
      `sendTransaction:\ntxnInvocation: ${toJson(
        txnInvocation,
      )}\nmaxFee: ${maxFee.toString()}}`,
    );

    const txnResp = await executeTxn(
      network,
      contractAddress,
      privateKey,
      txnInvocation,
      undefined,
      {
        maxFee,
      },
      CAIRO_VERSION_LEGACY,
    );

    logger.log(`sendTransaction:\ntxnResp: ${toJson(txnResp)}`);

    if (!txnResp?.transaction_hash) {
      throw new Error(`Transaction hash is not found`);
    }

    const txn = newInvokeTransaction({
      txnHash: txnResp.transaction_hash,
      senderAddress: contractAddress,
      chainId: network.chainId,
      maxFee: maxFee.toString(10),
      calls: [txnInvocation],
      // whenever upgrade is happen, we pay the fee in ETH, so txnVersion is 1
      txnVersion: 1,
    });

    await upsertTransaction(txn, wallet, saveMutex);

    return txnResp;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
