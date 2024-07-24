import { num as numUtils } from 'starknet';

import type {
  Transaction,
  VoyagerTransactionType,
} from '../../types/snapState';
import { TransactionStatusType } from '../../types/snapState';

export type ITransactionFilter = {
  apply(txn: Transaction | object): boolean;
};

export class TimestampFilter implements ITransactionFilter {
  timestamp: number | undefined;

  constructor(timestamp: number | undefined) {
    this.timestamp = timestamp;
  }

  apply(txn: Transaction): boolean {
    if (this.timestamp) {
      return txn.timestamp * 1000 >= this.timestamp;
    }

    return true;
  }
}

export class SenderAddressFilter implements ITransactionFilter {
  senderAddress: bigint | undefined;

  constructor(senderAddress: bigint | undefined) {
    this.senderAddress = senderAddress;
  }

  apply(txn: Transaction): boolean {
    if (this.senderAddress) {
      return numUtils.toBigInt(txn.senderAddress) === this.senderAddress;
    }

    return true;
  }
}

export class ContractAddressFilter implements ITransactionFilter {
  contractAddress: bigint | undefined;

  constructor(contractAddress: bigint | undefined) {
    this.contractAddress = contractAddress;
  }

  apply(txn: Transaction): boolean {
    if (this.contractAddress) {
      return numUtils.toBigInt(txn.contractAddress) === this.contractAddress;
    }

    return true;
  }
}

export class TxnTypeFilter implements ITransactionFilter {
  txnType: VoyagerTransactionType | string | string[] | undefined;

  constructor(txnType: VoyagerTransactionType | string | string[] | undefined) {
    this.txnType = txnType;
  }

  apply(txn: Transaction): boolean {
    if (this.txnType) {
      if (Array.isArray(this.txnType)) {
        return this.txnType.includes(txn.txnType);
      }
      return txn.txnType === this.txnType;
    }
    return true;
  }
}

export class StatusFilter implements ITransactionFilter {
  finalityStatus: string[] = [];

  executionStatus: string[] = [];

  constructor(
    finalityStatus: string | string[] | undefined,
    executionStatus: string | string[] | undefined,
  ) {
    if (finalityStatus) {
      this.finalityStatus = Array.isArray(finalityStatus)
        ? finalityStatus.map((status) => status.toLowerCase())
        : [finalityStatus.toLowerCase()];
    }
    if (executionStatus) {
      this.executionStatus = Array.isArray(executionStatus)
        ? executionStatus.map((status) => status.toLowerCase())
        : [executionStatus.toLowerCase()];
    }
  }

  apply(txn: Transaction): boolean {
    if (this.finalityStatus.length > 0 || this.executionStatus.length > 0) {
      let deprecationStatusCond = false;
      let finalityStatusCond = false;
      let executionStatusCond = false;

      if (txn[TransactionStatusType.DEPRECATION]) {
        deprecationStatusCond =
          this.finalityStatus.includes(
            txn[TransactionStatusType.DEPRECATION].toLowerCase(),
          ) ||
          this.executionStatus.includes(
            txn[TransactionStatusType.DEPRECATION].toLowerCase(),
          );
      }

      if (this.finalityStatus) {
        finalityStatusCond =
          Object.prototype.hasOwnProperty.call(
            txn,
            TransactionStatusType.FINALITY,
          ) &&
          txn[TransactionStatusType.FINALITY] &&
          this.finalityStatus.includes(
            txn[TransactionStatusType.FINALITY].toLowerCase(),
          );
      }

      if (this.executionStatus) {
        executionStatusCond =
          Object.prototype.hasOwnProperty.call(
            txn,
            TransactionStatusType.EXECUTION,
          ) &&
          txn[TransactionStatusType.EXECUTION] &&
          this.executionStatus.includes(
            txn[TransactionStatusType.EXECUTION].toLowerCase(),
          );
      }
      return deprecationStatusCond || finalityStatusCond || executionStatusCond;
    }
    return true;
  }
}

export class ChainIdFilter implements ITransactionFilter {
  chainId: string | undefined;

  constructor(chainId: string | undefined) {
    this.chainId = chainId;
  }

  apply(txn: Transaction): boolean {
    if (this.chainId) {
      return numUtils.toBigInt(txn.chainId) === numUtils.toBigInt(this.chainId);
    }

    return true;
  }
}

/**
 *
 * @param txns
 * @param filters
 */
export function filterTransactions(
  txns: Transaction[],
  filters: ITransactionFilter[],
) {
  return txns.filter((txn) => {
    return filters.every((filter) => filter.apply(txn));
  });
}
