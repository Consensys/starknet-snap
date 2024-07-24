import { expect } from 'chai';
import { num } from 'starknet';
import {
  createAccountProxyTxn,
  initAccountTxn,
  txn1,
  txn2,
  txn3,
  txn4,
  txn5,
  account1,
  RejectedTxn,
  RejectedTxn2,
} from '../../constants.test';
import {
  VoyagerTransactionType,
  TransactionStatus,
  Transaction,
} from '../../../src/types/snapState';

import * as filter from '../../../src/utils/transaction/filter';

describe('Test function: getTransactions', function () {
  const transactions = [
    txn1,
    txn2,
    txn3,
    txn4,
    txn5,
    createAccountProxyTxn,
    initAccountTxn,
  ];
  const transactions2 = [txn1, txn2, txn3, txn5, RejectedTxn, RejectedTxn2];
  describe('TimestampFilter', () => {
    it('Should filter transactions based on timestamp', () => {
      const timestamp = 1653553084;
      let timestampForTest = 1653553083;
      const cloneTransactions = transactions.reduce(
        (acc: Transaction[], txn: Transaction) => {
          acc.push({ ...txn, timestamp: timestampForTest });
          timestampForTest += 1;
          return acc;
        },
        [],
      );
      const timestampFilter = new filter.TimestampFilter(timestamp * 1000);
      const filteredTxnList = filter.filterTransactions(cloneTransactions, [
        timestampFilter,
      ]);
      expect(filteredTxnList).to.have.lengthOf(cloneTransactions.length - 1);
    });
  });

  describe('SenderAddressFilter', () => {
    it('Should filter transactions based on senderAddress', () => {
      const senderAddress = transactions[0].senderAddress;
      const cloneTransactions = transactions.reduce(
        (acc: Transaction[], txn: Transaction) => {
          acc.push({ ...txn, senderAddress: senderAddress });
          return acc;
        },
        [],
      );
      const addressFilter = new filter.SenderAddressFilter(
        num.toBigInt(senderAddress),
      );
      const filteredTxnList = filter.filterTransactions(cloneTransactions, [
        addressFilter,
      ]);
      expect(filteredTxnList).to.have.lengthOf(cloneTransactions.length);
    });
  });

  describe('ContractAddressFilter', () => {
    it('Should filter transactions based on contract address', () => {
      const contractAddress = transactions[0].contractAddress;
      const cloneTransactions = transactions.reduce(
        (acc: Transaction[], txn: Transaction) => {
          acc.push({ ...txn, contractAddress: contractAddress });
          return acc;
        },
        [],
      );
      const addressFilter = new filter.ContractAddressFilter(
        num.toBigInt(contractAddress),
      );
      const filteredTxnList = filter.filterTransactions(cloneTransactions, [
        addressFilter,
      ]);
      expect(filteredTxnList).to.have.lengthOf(cloneTransactions.length);
    });
  });

  describe('TxnTypeFilter', () => {
    it('Should filter transactions based on txn type', () => {
      const typeFilter = new filter.TxnTypeFilter([
        VoyagerTransactionType.DEPLOY,
        VoyagerTransactionType.DEPLOY_ACCOUNT,
      ]);
      const filteredTxnList = filter.filterTransactions(transactions, [
        typeFilter,
      ]);
      expect(filteredTxnList).to.have.lengthOf(1);
    });
  });

  describe('ChainIdFilter', () => {
    it('Should filter transactions based on chainId', () => {
      const orgChainId = transactions[0].chainId;
      transactions[0].chainId = '99';
      const chainIdFilter = new filter.ChainIdFilter(transactions[0].chainId);
      const filteredTxnList = filter.filterTransactions(transactions, [
        chainIdFilter,
      ]);
      expect(filteredTxnList).to.have.lengthOf(1);
      transactions[0].chainId = orgChainId;
    });
  });

  describe('StatusFilter', () => {
    it('Should filter transactions based on status', () => {
      const statusFilter = new filter.StatusFilter(
        [TransactionStatus.PENDING, TransactionStatus.ACCEPTED_ON_L1],
        [TransactionStatus.REJECTED],
      );
      const filteredTxnList = filter.filterTransactions(transactions2, [
        statusFilter,
      ]);
      expect(filteredTxnList).to.have.lengthOf(3);
    });

    it('Should filter empty status transactions', () => {
      const cloneTransactions = transactions.reduce(
        (acc: Transaction[], txn: Transaction) => {
          acc.push({
            ...txn,
            status: '',
            finalityStatus: '',
            executionStatus: '',
          });
          return acc;
        },
        [],
      );

      const statusFilter = new filter.StatusFilter(
        [TransactionStatus.PENDING, TransactionStatus.ACCEPTED_ON_L1],
        [TransactionStatus.REJECTED],
      );
      const filteredTxnList = filter.filterTransactions(cloneTransactions, [
        statusFilter,
      ]);
      expect(filteredTxnList).to.have.lengthOf(0);
    });

    it('Should filter finalityStatus transactions when status present', () => {
      const cloneTransactions = transactions.reduce(
        (acc: Transaction[], txn: Transaction) => {
          acc.push({
            ...txn,
            status: '',
            finalityStatus: TransactionStatus.ACCEPTED_ON_L1,
            executionStatus: '',
          });
          return acc;
        },
        [],
      );

      const statusFilter = new filter.StatusFilter(
        [TransactionStatus.PENDING, TransactionStatus.ACCEPTED_ON_L1],
        [TransactionStatus.REJECTED],
      );
      const filteredTxnList = filter.filterTransactions(cloneTransactions, [
        statusFilter,
      ]);
      expect(filteredTxnList).to.have.lengthOf(cloneTransactions.length);
    });

    it('Should filter executionStatus transactions when status present', () => {
      const cloneTransactions = transactions.reduce(
        (acc: Transaction[], txn: Transaction) => {
          acc.push({
            ...txn,
            status: '',
            finalityStatus: TransactionStatus.ACCEPTED_ON_L2,
            executionStatus: TransactionStatus.REJECTED,
          });
          return acc;
        },
        [],
      );
      const statusFilter = new filter.StatusFilter(
        [TransactionStatus.PENDING, TransactionStatus.ACCEPTED_ON_L1],
        [],
      );
      const filteredTxnList = filter.filterTransactions(cloneTransactions, [
        statusFilter,
      ]);
      expect(filteredTxnList).to.have.lengthOf(0);
    });
  });

  describe('CombinFilter', () => {
    it('Should filter transactions based on all condtition', () => {
      const filteredTxnList = filter.filterTransactions(
        [txn1, txn2, txn3, txn4, txn5, RejectedTxn, RejectedTxn2],
        [
          new filter.ContractAddressFilter(num.toBigInt(account1.address)),
          new filter.SenderAddressFilter(num.toBigInt(account1.address)),
          new filter.TimestampFilter(1653559059000),
          new filter.TxnTypeFilter([VoyagerTransactionType.INVOKE]),
          new filter.StatusFilter(
            [TransactionStatus.PENDING, TransactionStatus.ACCEPTED_ON_L1],
            [TransactionStatus.REJECTED],
          ),
        ],
      );
      expect(filteredTxnList).to.have.lengthOf(2);
    });
  });
});
