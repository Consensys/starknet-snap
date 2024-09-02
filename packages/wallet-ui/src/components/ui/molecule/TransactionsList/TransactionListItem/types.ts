import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Transaction, TransactionStatus, VoyagerTransactionType } from 'types';
import { shortenAddress } from 'utils/utils';
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

export const getTxnName = (transaction: Transaction): string => {
  if (transaction.txnType.toLowerCase() === VoyagerTransactionType.INVOKE) {
    if (transaction.contractFuncName.toLowerCase() === 'transfer') {
      return 'Send';
    } else if (transaction.contractFuncName.toLowerCase() === 'upgrade') {
      return 'Upgrade Account';
    }
  } else if (
    transaction.txnType.toLowerCase() === VoyagerTransactionType.DEPLOY
  ) {
    return 'Deploy';
  } else if (
    transaction.txnType.toLowerCase() === VoyagerTransactionType.DEPLOY_ACCOUNT
  ) {
    return 'Deploy Account';
  }
  return 'Unknown';
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

export const getTxnToFromLabel = (transaction: Transaction): string => {
  const txnName = getTxnName(transaction);
  switch (txnName) {
    case 'Send':
      // TODO : This will not be needed after getTransactions revamp.
      if (transaction.contractCallData.length === 3) {
        return (
          'To ' + shortenAddress(transaction.contractCallData[0].toString())
        );
      } else {
        return (
          'To ' + shortenAddress(transaction.contractCallData[4].toString())
        );
      }
    case 'Receive':
      return 'From ' + shortenAddress(transaction.senderAddress);
    case 'Deploy':
      return 'To ' + shortenAddress(transaction.contractAddress);
    default:
      return '';
  }
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
) => {
  let txnValue = '0';
  let txnUsdValue = '0';

  const txnName = getTxnName(transaction);
  switch (txnName) {
    case 'Send':
    case 'Receive':
      txnValue = ethers.utils.formatUnits(
        transaction.contractCallData[
          transaction.contractCallData.length - 2
        ].toString(),
        decimals,
      );
      txnUsdValue = (parseFloat(txnValue) * toUsdRate).toFixed(2);
      break;
    default:
      break;
  }

  return { txnValue, txnUsdValue };
};
