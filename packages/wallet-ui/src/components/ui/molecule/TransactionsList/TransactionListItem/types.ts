import { TransactionType } from 'starknet';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { ContractFuncName, Transaction, TransactionStatus } from 'types';
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
    case TransactionType.INVOKE:
      if (
        transaction.accountCalls &&
        transaction.accountCalls[contractAddress] !== undefined
      ) {
        for (const call of transaction.accountCalls[contractAddress]) {
          if (call.contractFuncName === ContractFuncName.Transfer) {
            return 'Send';
          }
          if (call.contractFuncName === ContractFuncName.Upgrade) {
            return 'Upgrade Account';
          }
        }
      }
      return 'Contract Interaction';
    case TransactionType.DEPLOY:
      return 'Depoly';
    case TransactionType.DEPLOY_ACCOUNT:
      return 'Deploy Account';
    default:
      return 'Unknown';
  }
};

export const getTxnDate = (
  transaction: Transaction,
  language: string,
): string => {
  const date = new Date(transaction.timestamp * 1000);

  let localeDate;
  switch (language) {
    case 'fr':
      localeDate = 'fr-FR';
      break;
    default:
      localeDate = 'en-US';
  }

  return date.toLocaleString(localeDate, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTxnStatus = (transaction: Transaction): string => {
  let statusStr = [];
  if (transaction.executionStatus) {
    statusStr.push(formatStatus(transaction.executionStatus));
  }
  if (transaction.finalityStatus === transaction.executionStatus) {
    return transaction.finalityStatus
      ? formatStatus(transaction.finalityStatus)
      : '';
  }
  if (transaction.finalityStatus) {
    statusStr.push(formatStatus(transaction.finalityStatus));
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
  if (
    transaction.accountCalls &&
    transaction.accountCalls[tokenAddress] !== undefined
  ) {
    txnValue = ethers.utils.formatUnits(
      // A transaction can have multiple contract calls with the same tokenAddress.
      // Hence, it is necessary to sum the amount of all contract calls with the same tokenAddress.
      transaction.accountCalls[tokenAddress].reduce((acc, call) => {
        // When the contract function is `transfer`,
        // there is a amount representing the transfer value of that contract call.
        if (call.contractFuncName === ContractFuncName.Transfer) {
          const value = BigInt(call.amount || '0');
          acc += value;
        }
        return acc;
      }, BigInt(0)),
      decimals,
    );

    txnUsdValue = (parseFloat(txnValue) * toUsdRate).toFixed(2);
  }

  return { txnValue, txnUsdValue };
};
