import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  Transaction,
  TransactionStatus,
  StarkscanTransactionType,
} from 'types';
import { ethers } from 'ethers';

export const getIcon = (transactionName: string): IconProp => {
  switch (transactionName) {
    case 'Send':
      return ['fas', 'long-arrow-alt-up'];
    case 'Receive':
      return ['fas', 'long-arrow-alt-down'];
    case 'Deploy':
    case 'Deploy Account':
      return ['fas', 'long-arrow-alt-up'];
    default:
      return ['fas', 'arrow-right-arrow-left'];
  }
};

export const getTxnName = (
  transaction: Transaction,
  contractAddress: string,
): string => {
  switch (transaction.txnType) {
    case StarkscanTransactionType.INVOKE:
      if (
        transaction.accountCalls &&
        transaction.accountCalls[contractAddress]
      ) {
        if (
          transaction.accountCalls[contractAddress].some(
            (call) => call.contractFuncName === 'transfer',
          )
        ) {
          return 'Send';
        } else if (
          transaction.accountCalls[contractAddress].some(
            (call) => call.contractFuncName === 'upgrade',
          )
        ) {
          return 'Upgrade Account';
        }
      }
      return 'Contract Interaction';
    case StarkscanTransactionType.DEPLOY:
      return 'Depoly';
    case StarkscanTransactionType.DEPLOY_ACCOUNT:
      return 'Deploy Account';
    default:
      return 'Unknown';
  }
};

export const getTxnDate = (transaction: Transaction): string => {
  const date = new Date(transaction.timestamp * 1000);

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTxnStatus = (transaction: Transaction): string => {
  let statusStr = [];
  if (transaction.finalityStatus === transaction.executionStatus) {
    return transaction.finalityStatus
      ? formatStatus(transaction.finalityStatus)
      : '';
  }
  if (transaction.finalityStatus) {
    statusStr.push(formatStatus(transaction.finalityStatus));
  }
  if (transaction.executionStatus) {
    statusStr.push(formatStatus(transaction.executionStatus));
  }
  return statusStr.join(' / ');
};

export const formatStatus = (status: string): string => {
  return status
    .replaceAll('_', ' ')
    .split(' ')
    .map((word) => {
      word = word.toLowerCase();
      if (word !== 'on') {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
};

export const getTxnFailureReason = (transaction: Transaction): string => {
  return transaction.executionStatus &&
    transaction.executionStatus.toLowerCase() ===
      TransactionStatus.REJECTED.toLowerCase() &&
    transaction?.failureReason
    ? ` (${transaction.failureReason})`
    : '';
};

export const getTxnValues = (
  transaction: Transaction,
  decimals: number = 18,
  toUsdRate: number = 0,
  tokenAddress: string,
) => {
  let txnValue = '0';
  let txnUsdValue = '0';
  if (transaction.accountCalls && transaction.accountCalls[tokenAddress]) {
    txnValue = ethers.utils.formatUnits(
      transaction.accountCalls[tokenAddress]
        .filter((call) => call.contractFuncName === 'transfer') // Filter for "transfer" calls
        .reduce((acc, call) => {
          // Extract the BigInt value from contractCallData
          const value = BigInt(
            call.contractCallData[call.contractCallData.length - 2].toString(),
          );
          return acc + value; // Sum the BigInt values
        }, BigInt(0)),
      decimals,
    ); // Start with BigInt(0) as the initial value

    txnUsdValue = (parseFloat(txnValue) * toUsdRate).toFixed(2);
  }

  return { txnValue, txnUsdValue };
};
