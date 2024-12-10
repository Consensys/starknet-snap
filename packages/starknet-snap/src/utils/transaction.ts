import { constants } from 'starknet';

import { FeeToken } from '../types/snapApi';

/**
 * Convert the transaction version to number.
 *
 * @param txnVersion - The transaction version.
 * @returns The transaction version number.
 */
export function transactionVersionToNumber(txnVersion: string): number {
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
