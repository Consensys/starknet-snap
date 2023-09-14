import { toJson } from './utils/serializer';
import { num } from 'starknet';
import { validateAndParseAddress } from '../src/utils/starknetUtils';
import { ApiParams, GetTransactionsRequestParams } from './types/snapApi';
import { ExecutionStatus, Transaction, TransactionStatus, VoyagerTransactionType } from './types/snapState';
import { DEFAULT_GET_TXNS_LAST_NUM_OF_DAYS, DEFAULT_GET_TXNS_PAGE_SIZE } from './utils/constants';
import * as snapUtils from './utils/snapUtils';
import * as utils from './utils/starknetUtils';
import { logger } from './utils/logger';

export async function getTransactions(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, requestParams } = params;
    const requestParamsObj = requestParams as GetTransactionsRequestParams;
    try {
      validateAndParseAddress(requestParamsObj.senderAddress);
    } catch (err) {
      throw new Error(`The given sender address is invalid: ${requestParamsObj.senderAddress}`);
    }
    try {
      if (requestParamsObj.contractAddress) {
        validateAndParseAddress(requestParamsObj.contractAddress);
      }
    } catch (err) {
      throw new Error(`The given contract address is invalid: ${requestParamsObj.contractAddress}`);
    }

    const senderAddress = requestParamsObj.senderAddress;
    const contractAddress = requestParamsObj.contractAddress;
    const pageSize = snapUtils.getValidNumber(requestParamsObj.pageSize, DEFAULT_GET_TXNS_PAGE_SIZE, 1);
    const txnsInLastNumOfDays = snapUtils.getValidNumber(
      requestParamsObj.txnsInLastNumOfDays,
      DEFAULT_GET_TXNS_LAST_NUM_OF_DAYS,
      1,
    );
    const minTimeStamp = Date.now() - txnsInLastNumOfDays * 24 * 60 * 60 * 1000; // in ms
    const onlyFromState = !!requestParamsObj.onlyFromState;
    const withDeployTxn = !!requestParamsObj.withDeployTxn;
    const network = snapUtils.getNetworkFromChainId(state, requestParamsObj.chainId);

    let massagedTxns: Transaction[] = [];
    if (!onlyFromState) {
      massagedTxns = await utils.getMassagedTransactions(
        senderAddress,
        contractAddress,
        pageSize,
        minTimeStamp,
        withDeployTxn,
        network,
      );
    }
    logger.log(`getTransactions\nmassagedTxns initial total: ${massagedTxns.length}`);

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

    logger.log(`getTransactions\storedUnsettledTxns:\n${toJson(storedUnsettledTxns)}`);

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
      logger.log(`getTransactions\nstoredUnsettledDeployTxns:\n${toJson(storedUnsettledDeployTxns)}`);
      storedUnsettledTxns = [...storedUnsettledTxns, ...storedUnsettledDeployTxns];
    }

    // For each "unsettled" txn, update the timestamp from the same txn found in massagedTxns
    const requireUpdateStatus = [];
    const massagedTxnsMap = snapUtils.toMap<bigint, Transaction>(massagedTxns, 'txnHash', num.toBigInt);

    storedUnsettledTxns.forEach((txn: Transaction, idx: number) => {
      const foundMassagedTxn = massagedTxnsMap.get(num.toBigInt(txn.txnHash));
      if (!foundMassagedTxn) {
        const statusUpdatePromise = async (idx) => {
          try {
            // it is possible to fail in getTransactionStatus, but it wont throw error as expected, hence the status will be remain
            const { finalityStatus, executionStatus } = await utils.getTransactionStatus(
              storedUnsettledTxns[idx].txnHash,
              network,
            );
            storedUnsettledTxns[idx].finalityStatus = finalityStatus;
            storedUnsettledTxns[idx].executionStatus = executionStatus;
            storedUnsettledTxns[idx].status = ''; // DEPRECATION
            storedUnsettledTxns[idx].failureReason = storedUnsettledTxns[idx].failureReason || '';
          } catch (e) {
            logger.error(
              `Problem found in statusUpdatePromise:\n txn: ${storedUnsettledTxns[idx].txnHash}, err: \n${e.message}`,
            );
          } finally {
            // statusUpdatePromise is run in parallel, hence mutex is require to lock the massagedTxns array
            return saveMutex.runExclusive(async () => {
              massagedTxns.push(storedUnsettledTxns[idx]);
            });
          }
        };
        requireUpdateStatus.push(statusUpdatePromise(idx));
      } else {
        txn.timestamp = foundMassagedTxn?.timestamp;
        txn.finalityStatus = foundMassagedTxn?.finalityStatus;
        txn.executionStatus = foundMassagedTxn?.executionStatus;
        txn.status = ''; // DEPRECATION
      }
    });

    logger.log(`getTransactions\nstoredUnsettledTxns:\n${toJson(storedUnsettledTxns)}`);

    // For each "unsettled" txn, get the latest status from the provider (RPC)
    if (requireUpdateStatus) {
      await Promise.allSettled(requireUpdateStatus);
      logger.log(`getTransactions\nstoredUnsettledTxns after updated status:\n${toJson(storedUnsettledTxns)}`);
    }

    // Update the transactions in state in a single call
    await snapUtils.upsertTransactions(storedUnsettledTxns, wallet, saveMutex);

    // Clean up all ACCEPTED_ON_L1 and ACCEPTED_ON_L2 txns from state that has timestamp less than minTimeStamp as they will be retrievable from the Voyager "api/txns" endpoint
    await snapUtils.removeAcceptedTransaction(minTimeStamp, wallet, saveMutex);

    // Sort in timestamp descending order
    massagedTxns = massagedTxns.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp);
    logger.log(`getTransactions\nmassagedTxns:\n${toJson(massagedTxns)}`);

    return massagedTxns;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
