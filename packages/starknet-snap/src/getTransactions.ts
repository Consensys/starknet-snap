import { toJson } from './utils/serializer';
import { num } from 'starknet';
import { validateAndParseAddress } from '../src/utils/starknetUtils';
import { ApiParams, GetTransactionsRequestParams } from './types/snapApi';
import { Transaction, TransactionStatus, VoyagerTransactionType } from './types/snapState';
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

    // Retrieve the RECEIVED, PENDING, and ACCEPTED_ON_L2 txns from snap state
    let storedUnsettledTxns = snapUtils.getTransactions(
      state,
      network.chainId,
      senderAddress,
      contractAddress,
      undefined,
      [
        TransactionStatus.RECEIVED,
        TransactionStatus.NOT_RECEIVED,
        TransactionStatus.PENDING,
        TransactionStatus.ACCEPTED_ON_L2,
      ],
      minTimeStamp,
    );

    if (withDeployTxn) {
      const storedUnsettledDeployTxns = snapUtils.getTransactions(
        state,
        network.chainId,
        senderAddress,
        undefined, // contractAddress: senderAddress,
        [VoyagerTransactionType.DEPLOY, VoyagerTransactionType.DEPLOY_ACCOUNT],
        [
          TransactionStatus.RECEIVED,
          TransactionStatus.NOT_RECEIVED,
          TransactionStatus.PENDING,
          TransactionStatus.ACCEPTED_ON_L2,
        ],
        undefined,
      );
      logger.log(`getTransactions\nstoredUnsettledDeployTxns:\n${toJson(storedUnsettledDeployTxns)}`);
      storedUnsettledTxns = [...storedUnsettledTxns, ...storedUnsettledDeployTxns];
    }

    // For each "unsettled" txn, update the status and timestamp from the same txn found in massagedTxns
    storedUnsettledTxns.forEach((txn) => {
      const foundMassagedTxn = massagedTxns.find(
        (massagedTxn) => num.toBigInt(massagedTxn.txnHash) === num.toBigInt(txn.txnHash),
      );
      txn.status = foundMassagedTxn?.status ?? txn.status;
      txn.timestamp = foundMassagedTxn?.timestamp ?? txn.timestamp;
    });

    logger.log(`getTransactions\nstoredUnsettledTxns:\n${toJson(storedUnsettledTxns)}`);

    // Retrieve the REJECTED txns from snap state
    const storedRejectedTxns = snapUtils.getTransactions(
      state,
      network.chainId,
      senderAddress,
      contractAddress,
      undefined,
      TransactionStatus.REJECTED,
      minTimeStamp,
    );
    logger.log(`getTransactions\nstoredRejectedTxns:\n${toJson(storedRejectedTxns)}`);

    // For each "unsettled" txn, get the latest status from the provider (RPC or sequencer)
    await Promise.allSettled(
      storedUnsettledTxns.map(async (txn) => {
        const txnStatus = await utils.getTransactionStatus(txn.txnHash, network);
        txn.status = txnStatus ?? txn.status;
        txn.failureReason = txn.failureReason || '';
      }),
    );
    logger.log(`getTransactions\nstoredUnsettledTxns after updated status:\n${toJson(storedUnsettledTxns)}`);

    // Update the transactions in state in a single call
    await snapUtils.upsertTransactions(storedUnsettledTxns, wallet, saveMutex);

    // Filter out massaged txns that are found in the updated stored txns
    massagedTxns = massagedTxns.filter((massagedTxn) => {
      return !storedUnsettledTxns.find((txn) => num.toBigInt(txn.txnHash) === num.toBigInt(massagedTxn.txnHash));
    });
    logger.log(`getTransactions\nmassagedTxns after filtered total:\n${massagedTxns.length}`);

    // Clean up all ACCEPTED_ON_L1 and ACCEPTED_ON_L2 txns that has timestamp less than minTimeStamp as they will be retrievable from the Voyager "api/txns" endpoint
    await snapUtils.removeAcceptedTransaction(minTimeStamp, wallet, saveMutex);

    // Sort in timestamp descending order
    massagedTxns = [...massagedTxns, ...storedUnsettledTxns, ...storedRejectedTxns].sort(
      (a: Transaction, b: Transaction) => b.timestamp - a.timestamp,
    );
    logger.log(`getTransactions\nmassagedTxns:\n${toJson(massagedTxns)}`);

    return massagedTxns;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
