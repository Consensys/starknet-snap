import type { Call } from 'starknet';
import {
  constants,
  TransactionFinalityStatus,
  TransactionType,
} from 'starknet';

import { FeeToken } from '../types/snapApi';
import type { TranscationAccountCall, V2Transaction } from '../types/snapState';
import { ContractFuncName, TransactionDataVersion } from '../types/snapState';
import { TRANSFER_SELECTOR_HEX, UPGRADE_SELECTOR_HEX } from './constants';
import { msToSec } from './formatter-utils';

/**
 * Convert the transaction version to number.
 *
 * @param txnVersion - The transaction version.
 * @returns The transaction version number.
 */
export function transactionVersionToNumber(
  txnVersion: string | number,
): number {
  const v3TxnVersion = new Set([
    constants.TRANSACTION_VERSION.V3,
    constants.TRANSACTION_VERSION.F3,
    '3',
    3,
  ]);
  return v3TxnVersion.has(txnVersion) ? 3 : 1;
}

/**
 * Convert the feeToken unit to transaction version.
 *
 * @param feeToken - The feeToken unit.
 * @returns The transaction version.
 */
export function feeTokenToTransactionVersion(
  feeToken: string,
): constants.TRANSACTION_VERSION {
  return feeToken === FeeToken.STRK
    ? constants.TRANSACTION_VERSION.V3
    : constants.TRANSACTION_VERSION.V1;
}

/**
 * Convert the transaction version to feeToken unit.
 *
 * @param txnVersion - The transaction version.
 * @returns The feeToken unit.
 */
export function transactionVersionToFeeToken(txnVersion: string): FeeToken {
  return txnVersion === constants.TRANSACTION_VERSION.V3
    ? FeeToken.STRK
    : FeeToken.ETH;
}

/**
 * Convert the transaction selector to string name.
 * If the selector is not known, return the selector.
 *
 * @param selector - The transaction selector.
 * @returns The meaningful name of the selector if it is known, otherwise return the selector.
 */
export function transactionSelectorToName(selector: string): string {
  switch (selector.toLowerCase()) {
    case ContractFuncName.Transfer:
    case TRANSFER_SELECTOR_HEX.toLowerCase():
      return ContractFuncName.Transfer;
    case ContractFuncName.Upgrade:
    case UPGRADE_SELECTOR_HEX.toLowerCase():
      return ContractFuncName.Upgrade;
    default:
      return selector;
  }
}

/**
 * Convert an array of `Call` objects to a record of `TranscationAccountCall` objects.
 *
 * @param calls - The array of `Call` object.
 * @returns The record of `TranscationAccountCall` objects.
 */
export function callsToTranscationAccountCalls(
  calls: Call[],
): Record<string, TranscationAccountCall[]> {
  return calls.reduce((acc, call) => {
    const {
      contractAddress: contract,
      calldata: contractCallData,
      entrypoint,
    } = call;

    const contractFuncName = transactionSelectorToName(entrypoint);

    if (!Object.prototype.hasOwnProperty.call(acc, contract)) {
      acc[contract] = [];
    }

    const accountCall: TranscationAccountCall = {
      contract,
      contractFuncName,
      contractCallData: contractCallData as unknown as string[],
    };

    if (isFundTransferEntrypoint(entrypoint)) {
      accountCall.recipient = accountCall.contractCallData[0];
      accountCall.amount = accountCall.contractCallData[1];
    }

    acc[contract].push(accountCall);

    return acc;
  }, {});
}

/**
 * Check if the entrypoint is a fund transfer entrypoint.
 *
 * @param entrypoint - The entrypoint.
 * @returns `true` if the entrypoint is a fund transfer entrypoint, otherwise `false`.
 */
export function isFundTransferEntrypoint(entrypoint: string): boolean {
  return (
    entrypoint.toLowerCase() === TRANSFER_SELECTOR_HEX ||
    entrypoint.toLowerCase() === ContractFuncName.Transfer
  );
}

/**
 * Creates a new transaction object with the given data.
 *
 * @param params - The parameters of the new transaction object.
 * @param params.txnHash - The txn hash.
 * @param params.senderAddress - The sender address.
 * @param params.chainId - The chain id.
 * @param params.maxFee - The max fee.
 * @param params.calls - The array of `Call` object.
 * @param params.txnVersion - The transaction version.
 * @returns The new transaction object.
 */
export function newInvokeTransaction({
  txnHash,
  senderAddress,
  chainId,
  calls,
  txnVersion,
  maxFee,
}: {
  txnHash: string;
  senderAddress: string;
  chainId: string;
  maxFee: string;
  calls: Call[];
  txnVersion: number;
}): V2Transaction {
  return {
    txnHash,
    txnType: TransactionType.INVOKE,
    chainId,
    senderAddress,
    contractAddress: '',
    finalityStatus: TransactionFinalityStatus.RECEIVED,
    // executionStatus will be using the same result as finality if the transaction is yet confirmed
    executionStatus: TransactionFinalityStatus.RECEIVED,
    failureReason: '',
    timestamp: msToSec(Date.now()),
    dataVersion: TransactionDataVersion.V2,
    version: txnVersion,
    maxFee,
    // actualFee is always null if the transaction is yet confirmed
    actualFee: null,
    accountCalls: callsToTranscationAccountCalls(calls),
  };
}

/**
 * Creates a new transaction object for the deploy account transaction.
 *
 * @param params - The parameters of the new transaction object.
 * @param params.txnHash - The txn hash.
 * @param params.senderAddress - The sender address.
 * @param params.chainId - The chain id.
 * @param params.txnVersion - The transaction version.
 * @returns The new transaction object.
 */
export function newDeployTransaction({
  txnHash,
  senderAddress,
  chainId,
  txnVersion,
}: {
  txnHash: string;
  senderAddress: string;
  chainId: string;
  txnVersion: number;
}): V2Transaction {
  return {
    txnHash,
    txnType: TransactionType.DEPLOY_ACCOUNT,
    chainId,
    senderAddress,
    contractAddress: senderAddress,
    finalityStatus: TransactionFinalityStatus.RECEIVED,
    // executionStatus will be using the same result as finality if the transaction is yet confirmed
    executionStatus: TransactionFinalityStatus.RECEIVED,
    failureReason: '',
    timestamp: msToSec(Date.now()),
    dataVersion: TransactionDataVersion.V2,
    version: txnVersion,
    maxFee: null,
    // actualFee is always null if the transaction is yet confirmed
    actualFee: null,
    accountCalls: null,
  };
}
