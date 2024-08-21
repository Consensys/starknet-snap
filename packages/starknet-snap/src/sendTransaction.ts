import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import { num as numUtils, constants } from 'starknet';

import { createAccount } from './createAccount';
import type {
  ApiParamsWithKeyDeriver,
  SendTransactionRequestParams,
} from './types/snapApi';
import type { Transaction } from './types/snapState';
import { TransactionStatus, VoyagerTransactionType } from './types/snapState';
import { TRANSACTION_VERSION } from './utils/constants';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  getSendTxnText,
  upsertTransaction,
} from './utils/snapUtils';
import {
  validateAndParseAddress,
  getKeysFromAddress,
  getCallDataArray,
  executeTxn,
  isAccountDeployed,
  isUpgradeRequired,
  getEstimatedFees,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function sendTransaction(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as SendTransactionRequestParams;

    if (
      !requestParamsObj.contractAddress ||
      !requestParamsObj.address ||
      !requestParamsObj.contractFuncName
    ) {
      throw new Error(
        `The given contract address, sender address, and function name need to be non-empty string, got: ${toJson(
          requestParamsObj,
        )}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.contractAddress);
    } catch (error) {
      throw new Error(
        `The given contract address is invalid: ${requestParamsObj.contractAddress}`,
      );
    }
    try {
      validateAndParseAddress(requestParamsObj.address);
    } catch (error) {
      throw new Error(
        `The given sender address is invalid: ${requestParamsObj.address}`,
      );
    }
    const { address } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    if (await isUpgradeRequired(network, address)) {
      throw new Error('Upgrade required');
    }
    const { contractAddress } = requestParamsObj;
    const { contractFuncName } = requestParamsObj;
    const contractCallData = getCallDataArray(
      requestParamsObj.contractCallData as unknown as string,
    );
    const accountDeployed = await isAccountDeployed(network, address);

    const {
      privateKey: senderPrivateKey,
      addressIndex,
      publicKey,
    } = await getKeysFromAddress(keyDeriver, network, state, address);
    let maxFee = requestParamsObj.maxFee
      ? numUtils.toBigInt(requestParamsObj.maxFee)
      : constants.ZERO;
    if (maxFee === constants.ZERO) {
      const { suggestedMaxFee } = await getEstimatedFees(
        network,
        address,
        senderPrivateKey,
        publicKey,
        contractAddress,
        contractFuncName,
        contractCallData,
        TRANSACTION_VERSION,
        !accountDeployed,
      );
      maxFee = numUtils.toBigInt(suggestedMaxFee);
    }

    const signingTxnComponents = getSendTxnText(
      state,
      contractAddress,
      contractFuncName,
      contractCallData,
      address,
      maxFee,
      network,
    );
    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([
          heading('Do you want to sign this transaction ?'),
          ...signingTxnComponents,
        ]),
      },
    });
    if (!response) {
      return false;
    }

    const txnInvocation = {
      contractAddress,
      entrypoint: contractFuncName,
      calldata: contractCallData,
    };

    logger.log(
      `sendTransaction:\ntxnInvocation: ${toJson(
        txnInvocation,
      )}\nmaxFee: ${maxFee.toString()}}`,
    );

    if (!accountDeployed) {
      // Deploy account before sending the transaction
      logger.log(
        'sendTransaction:\nFirst transaction : send deploy transaction',
      );
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
      await createAccount(createAccountApiParams, true, true);
    }

    // In case this is the first transaction we assign a nonce of 1 to make sure it does after the deploy transaction
    const nonceSendTransaction = accountDeployed ? undefined : 1;
    const txnResp = await executeTxn(
      network,
      address,
      senderPrivateKey,
      txnInvocation,
      undefined,
      {
        maxFee,
        nonce: nonceSendTransaction,
      },
    );

    logger.log(`sendTransaction:\ntxnResp: ${toJson(txnResp)}`);

    if (txnResp.transaction_hash) {
      const txn: Transaction = {
        txnHash: txnResp.transaction_hash,
        txnType: VoyagerTransactionType.INVOKE,
        chainId: network.chainId,
        senderAddress: address,
        contractAddress,
        contractFuncName,
        contractCallData: contractCallData.map(
          (data: numUtils.BigNumberish) => {
            try {
              return numUtils.toHex(numUtils.toBigInt(data));
            } catch (error) {
              // data is already send to chain, hence we should not throw error
              return '0x0';
            }
          },
        ),
        finalityStatus: TransactionStatus.RECEIVED,
        executionStatus: TransactionStatus.RECEIVED,
        status: '', // DEPRECATED LATER
        failureReason: '',
        eventIds: [],
        timestamp: Math.floor(Date.now() / 1000),
      };

      await upsertTransaction(txn, wallet, saveMutex);
    }

    return txnResp;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
