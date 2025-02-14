import { TransactionType } from 'starknet';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { ContractFuncName, Transaction, TransactionStatus } from 'types';
import { ethers } from 'ethers';

export enum TxnType {
  Send = 'send',
  UpgradeAccount = 'upgradeAccount',
  ContractInteraction = 'contractInteraction',
  Deploy = 'deploy',
  DeployAccount = 'deployAccount',
  Unknown = 'unknown',
}

export const getIcon = (transactionName: string): IconProp => {
  switch (transactionName) {
    case 'Send':
      return ['fas', 'long-arrow-alt-up'];
    case 'Deploy':
    case 'Deploy Account':
      return ['fas', 'long-arrow-alt-up'];
    default:
      return ['fas', 'arrow-right-arrow-left'];
  }
};

export const getTranslationNameForTxnType = (
  txnType: TxnType,
  translate: (key: string) => string,
): string => {
  switch (txnType) {
    case TxnType.Send:
      return translate('send');
    case TxnType.UpgradeAccount:
      return translate('upgradeAccount');
    case TxnType.ContractInteraction:
      return translate('contractInteraction');
    case TxnType.Deploy:
      return translate('deploy');
    case TxnType.DeployAccount:
      return translate('deployAccount');
    default:
      return translate('unknown');
  }
};

export const getTxnName = (
  transaction: Transaction,
  contractAddress: string,
): TxnType => {
  switch (transaction.txnType) {
    case TransactionType.INVOKE:
      if (
        transaction.accountCalls &&
        transaction.accountCalls[contractAddress] !== undefined
      ) {
        for (const call of transaction.accountCalls[contractAddress]) {
          if (call.contractFuncName === ContractFuncName.Transfer) {
            return TxnType.Send;
          }
          if (call.contractFuncName === ContractFuncName.Upgrade) {
            return TxnType.UpgradeAccount;
          }
        }
      }
      return TxnType.ContractInteraction;
    case TransactionType.DEPLOY:
      return TxnType.Deploy;
    case TransactionType.DEPLOY_ACCOUNT:
      return TxnType.DeployAccount;
    default:
      return TxnType.Unknown;
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
