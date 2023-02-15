import { number, validateAndParseAddress } from 'starknet';
import { ApiParams, GetTransactionsRequestParams } from './types/snapApi';
import { Transaction, TransactionStatus, VoyagerTransactionType } from './types/snapState';
import { DEFAULT_GET_TXNS_LAST_NUM_OF_DAYS, DEFAULT_GET_TXNS_PAGE_SIZE } from './utils/constants';
import * as snapUtils from './utils/snapUtils';
import * as utils from './utils/starknetUtils';

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
      validateAndParseAddress(requestParamsObj.contractAddress);
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
    console.log(`getTransactions\nmassagedTxns initial total: ${massagedTxns.length}`);

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
      console.log(`getTransactions\nstoredUnsettledDeployTxns:\n${JSON.stringify(storedUnsettledDeployTxns)}`);
      storedUnsettledTxns = [...storedUnsettledTxns, ...storedUnsettledDeployTxns];
    }

    // For each "unsettled" txn, update the status and timestamp from the same txn found in massagedTxns
    storedUnsettledTxns.forEach((txn) => {
      const foundMassagedTxn = massagedTxns.find((massagedTxn) =>
        number.toBN(massagedTxn.txnHash).eq(number.toBN(txn.txnHash)),
      );
      txn.status = foundMassagedTxn?.status ?? txn.status;
      txn.timestamp = foundMassagedTxn?.timestamp ?? txn.timestamp;
    });

    console.log(`getTransactions\nstoredUnsettledTxns:\n${JSON.stringify(storedUnsettledTxns)}`);

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
    console.log(`getTransactions\nstoredRejectedTxns:\n${JSON.stringify(storedRejectedTxns)}`);

    // For each "unsettled" txn, get the latest status from the provider (RPC or sequencer)
    await Promise.allSettled(
      storedUnsettledTxns.map(async (txn) => {
        const txnStatus = await utils.getTransactionStatus(txn.txnHash, network);
        txn.status = txnStatus ?? txn.status;
        txn.failureReason = txn.failureReason || '';
      }),
    );
    console.log(`getTransactions\nstoredUnsettledTxns after updated status:\n${JSON.stringify(storedUnsettledTxns)}`);

    // Update the transactions in state in a single call
    await snapUtils.upsertTransactions(storedUnsettledTxns, wallet, saveMutex);

    // Filter out massaged txns that are found in the updated stored txns
    massagedTxns = massagedTxns.filter((massagedTxn) => {
      return !storedUnsettledTxns.find((txn) => number.toBN(txn.txnHash).eq(number.toBN(massagedTxn.txnHash)));
    });
    console.log(`getTransactions\nmassagedTxns after filtered total:\n${massagedTxns.length}`);

    // Clean up all ACCEPTED_ON_L1 and ACCEPTED_ON_L2 txns that has timestamp less than minTimeStamp as they will be retrievable from the Voyager "api/txns" endpoint
    await snapUtils.removeAcceptedTransaction(minTimeStamp, wallet, saveMutex);

    // Sort in timestamp descending order
    massagedTxns = [...massagedTxns, ...storedUnsettledTxns, ...storedRejectedTxns].sort(
      (a: Transaction, b: Transaction) => b.timestamp - a.timestamp,
    );
    console.log(`getTransactions\nmassagedTxns:\n${JSON.stringify(massagedTxns)}`);

    return massagedTxns;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
