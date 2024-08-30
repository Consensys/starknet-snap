import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import { num as numUtils, constants, CallData } from 'starknet';

import type {
  ApiParamsWithKeyDeriver,
  UpgradeTransactionRequestParams,
} from './types/snapApi';
import type { Transaction } from './types/snapState';
import { TransactionStatus, VoyagerTransactionType } from './types/snapState';
import { ACCOUNT_CLASS_HASH, CAIRO_VERSION_LEGACY } from './utils/constants';
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

    const method = 'upgrade';

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

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([
          heading('Do you want to sign this transaction ?'),
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

    const txn: Transaction = {
      txnHash: txnResp.transaction_hash,
      txnType: VoyagerTransactionType.INVOKE,
      chainId: network.chainId,
      senderAddress: contractAddress,
      contractAddress,
      contractFuncName: 'upgrade',
      contractCallData: CallData.compile(calldata),
      finalityStatus: TransactionStatus.RECEIVED,
      executionStatus: TransactionStatus.RECEIVED,
      status: '', // DEPRECATED LATER
      failureReason: '',
      eventIds: [],
      timestamp: Math.floor(Date.now() / 1000),
    };

    await upsertTransaction(txn, wallet, saveMutex);

    return txnResp;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
