import { num as numUtils } from 'starknet';

import type { ApiParams, GetTransactionsRequestParams } from './types/snapApi';
import type { Transaction, Network } from './types/snapState';
import {
  ExecutionStatus,
  TransactionStatus,
  VoyagerTransactionType,
} from './types/snapState';
import {
  DEFAULT_GET_TXNS_LAST_NUM_OF_DAYS,
  DEFAULT_GET_TXNS_PAGE_SIZE,
} from './utils/constants';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import * as snapUtils from './utils/snapUtils';
import * as utils from './utils/starknetUtils';
import { validateAndParseAddress } from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function getTransactions(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, requestParams } = params;
    const requestParamsObj = requestParams as GetTransactionsRequestParams;
    const { senderAddress, contractAddress } = requestParamsObj;

    try {
      validateAndParseAddress(senderAddress as unknown as string);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`The given sender address is invalid: ${senderAddress}`);
    }
    try {
      if (contractAddress) {
        validateAndParseAddress(contractAddress);
      }
    } catch (error) {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `The given contract address is invalid: ${contractAddress}`,
      );
    }

    const pageSize = snapUtils.getValidNumber(
      requestParamsObj.pageSize,
      DEFAULT_GET_TXNS_PAGE_SIZE,
      1,
    );
    const txnsInLastNumOfDays = snapUtils.getValidNumber(
      requestParamsObj.txnsInLastNumOfDays,
      DEFAULT_GET_TXNS_LAST_NUM_OF_DAYS,
      1,
    );
    const minTimeStamp = Date.now() - txnsInLastNumOfDays * 24 * 60 * 60 * 1000; // in ms
    const onlyFromState = Boolean(requestParamsObj.onlyFromState);
    const withDeployTxn = Boolean(requestParamsObj.withDeployTxn);
    const network = snapUtils.getNetworkFromChainId(
      state,
      requestParamsObj.chainId,
    );

    let massagedTxns: Transaction[] = [];
    if (!onlyFromState) {
      massagedTxns = await utils.getMassagedTransactions(
        senderAddress as unknown as string,
        contractAddress,
        pageSize,
        minTimeStamp,
        withDeployTxn,
        network,
      );
    }
    logger.log(
      `getTransactions\nmassagedTxns initial total: ${massagedTxns.length}`,
    );

    // Retrieve the Finaility Status: RECEIVED, PENDING, and ACCEPTED_ON_L2 txns from snap state
    // Retrieve the Execution Status: REJECTED txns from snap state
    let storedUnsettledTxns = snapUtils.getTransactions(
      state,
      network.chainId,
      senderAddress,
      contractAddress,
      undefined,
      [
        TransactionStatus.RECEIVED,
        TransactionStatus.ACCEPTED_ON_L2,
        TransactionStatus.NOT_RECEIVED,
        TransactionStatus.PENDING,
      ],
      ExecutionStatus.REJECTED,
      minTimeStamp,
    );

    logger.log(
      `getTransactions\nstoredUnsettledTxns:\n${toJson(storedUnsettledTxns)}`,
    );

    // Retrieve the Finaility Status: RECEIVED, PENDING, and ACCEPTED_ON_L2 txns from snap state
    // Retrieve the Execution Status: REJECTED txns from snap state
    if (withDeployTxn) {
      const storedUnsettledDeployTxns = snapUtils.getTransactions(
        state,
        network.chainId,
        senderAddress,
        undefined, // contractAddress: senderAddress,
        [VoyagerTransactionType.DEPLOY, VoyagerTransactionType.DEPLOY_ACCOUNT],
        [
          TransactionStatus.RECEIVED,
          TransactionStatus.ACCEPTED_ON_L2,
          TransactionStatus.NOT_RECEIVED,
          TransactionStatus.PENDING,
        ],
        ExecutionStatus.REJECTED,
        undefined,
      );
      logger.log(
        `getTransactions\nstoredUnsettledDeployTxns:\n${toJson(
          storedUnsettledDeployTxns,
        )}`,
      );
      storedUnsettledTxns = storedUnsettledTxns.concat(
        storedUnsettledDeployTxns,
      );
    }

    const updateStatusPromises: Promise<void>[] = [];
    const massagedTxnsMap = snapUtils.toMap<bigint, Transaction, string>(
      massagedTxns,
      'txnHash',
      numUtils.toBigInt,
    );

    storedUnsettledTxns.forEach((txn: Transaction) => {
      const foundMassagedTxn = massagedTxnsMap.get(
        numUtils.toBigInt(txn.txnHash),
      );
      if (foundMassagedTxn === undefined) {
        // For each "unsettled" txn, fetch the status when the txn not found in massagedTxns and push to massagedTxns
        updateStatusPromises.push(updateStatus(txn, network));
        massagedTxns.push(txn);
      } else {
        // For each "unsettled" txn, update the timestamp and status from the same txn found in massagedTxns
        txn.timestamp = foundMassagedTxn?.timestamp;
        txn.finalityStatus = foundMassagedTxn?.finalityStatus;
        txn.executionStatus = foundMassagedTxn?.executionStatus;
        txn.status = ''; // DEPRECATION
      }
    });

    logger.log(
      `getTransactions\nstoredUnsettledTxns:\n${toJson(storedUnsettledTxns)}`,
    );

    // For each "unsettled" txn, get the latest status from the provider (RPC)
    if (updateStatusPromises) {
      await Promise.allSettled(updateStatusPromises);
      logger.log(
        `getTransactions\nstoredUnsettledTxns after updated status:\n${toJson(
          storedUnsettledTxns,
        )}`,
      );
    }

    // Update the transactions in state in a single call
    await snapUtils.upsertTransactions(storedUnsettledTxns, wallet, saveMutex);

    // Clean up all ACCEPTED_ON_L1 and ACCEPTED_ON_L2 txns from state that has timestamp less than minTimeStamp as they will be retrievable from the Voyager "api/txns" endpoint
    await snapUtils.removeAcceptedTransaction(minTimeStamp, wallet, saveMutex);

    // Sort in timestamp descending order
    massagedTxns = massagedTxns.sort(
      (a: Transaction, b: Transaction) => b.timestamp - a.timestamp,
    );
    logger.log(`getTransactions\nmassagedTxns:\n${toJson(massagedTxns)}`);

    return massagedTxns;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}

/**
 *
 * @param txn
 * @param network
 */
export async function updateStatus(txn: Transaction, network: Network) {
  try {
    const { finalityStatus, executionStatus } =
      await utils.getTransactionStatus(txn.txnHash, network);
    // eslint-disable-next-line require-atomic-updates
    txn.finalityStatus = finalityStatus;
    // eslint-disable-next-line require-atomic-updates
    txn.executionStatus = executionStatus;
    // eslint-disable-next-line require-atomic-updates
    txn.status = ''; // DEPRECATION
  } catch (error) {
    logger.error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Problem found in updateStatus:\n txn: ${txn.txnHash}, error: \n${error.message}`,
    );
  }
}
