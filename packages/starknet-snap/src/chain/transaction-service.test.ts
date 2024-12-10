import { TransactionFinalityStatus, TransactionType } from 'starknet';

import { generateAccounts, generateTransactions } from '../__tests__/helper';
import { mockTransactionStateManager } from '../state/__tests__/helper';
import type { Network, Transaction } from '../types/snapState';
import { TransactionDataVersion } from '../types/snapState';
import {
  ETHER_SEPOLIA_TESTNET,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  STRK_SEPOLIA_TESTNET,
} from '../utils/constants';
import type { IDataClient } from './data-client';
import { TransactionService } from './transaction-service';

describe('TransactionService', () => {
  class MockTransactionService extends TransactionService {
    async *getTransactionsOnChain(
      address: string,
      contractAddress: string,
      tillToInDays: number,
    ) {
      yield* super.getTransactionsOnChain(
        address,
        contractAddress,
        tillToInDays,
      );
    }

    async *getTransactionsOnState(address: string, contractAddress: string) {
      yield* super.getTransactionsOnState(address, contractAddress);
    }

    async *filterTransactionsByContractAddress(
      transactions: Transaction[],
      contractAddress: string,
    ) {
      yield* super.filterTransactionsByContractAddress(
        transactions,
        contractAddress,
      );
    }

    hasMatchingContractOrIsDeploy(tx: Transaction, contractAddress: string) {
      return super.hasMatchingContractOrIsDeploy(tx, contractAddress);
    }
  }

  const mockDataClient = () => {
    const getTransactionsSpy = jest.fn();

    const dataClient: IDataClient = {
      getTransactions: getTransactionsSpy,
      getDeployTransaction: jest.fn(),
    };

    return {
      dataClient,
      getTransactionsSpy,
    };
  };

  const mockTransactionService = (
    network: Network,
    dataClient: IDataClient,
  ) => {
    const service = new MockTransactionService({
      dataClient,
      network,
    });

    return service;
  };

  const mockAddress = async (network: Network) => {
    const [{ address }] = await generateAccounts(network.chainId, 1);
    return address;
  };

  const generateEthAndStrkContractTransactions = ({ address, chainId }) => {
    const ethContractAddress = ETHER_SEPOLIA_TESTNET.address;
    const strkContractAddress = STRK_SEPOLIA_TESTNET.address;

    // generate transactions for eth contract, include deploy and invoke transactions
    const mockedEthTrasactions = generateTransactions({
      cnt: 10,
      address,
      txnTypes: [TransactionType.DEPLOY_ACCOUNT, TransactionType.INVOKE],
      chainId,
      contractAddresses: [ethContractAddress],
    });

    const lastTx = mockedEthTrasactions[mockedEthTrasactions.length - 1];
    const lastTxHashInBigInt = BigInt(lastTx.txnHash);

    // generate transactions for strk contract, include invoke transactions only
    const mockedStrkTrasactions = generateTransactions({
      cnt: 10,
      address,
      chainId,
      txnTypes: [TransactionType.INVOKE],
      contractAddresses: [strkContractAddress],
      // make sure the txnHash is unique for the transactions in strk contract
      baseTxnHashInBigInt: lastTxHashInBigInt + BigInt(1),
    });

    return mockedEthTrasactions
      .concat(mockedStrkTrasactions)
      .sort((tx1, tx2) => tx2.timestamp - tx1.timestamp);
  };

  const prepareGetTransactions = async () => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const address = await mockAddress(network);
    const transactionsFromDataClientOrState =
      generateEthAndStrkContractTransactions({
        address,
        chainId: network.chainId,
      });
    // the given contract address
    const contractAddress = ETHER_SEPOLIA_TESTNET.address;

    const { findTransactionsSpy, removeTransactionsSpy } =
      mockTransactionStateManager();
    const { getTransactionsSpy, dataClient } = mockDataClient();
    removeTransactionsSpy.mockReturnThis();
    findTransactionsSpy.mockResolvedValue(transactionsFromDataClientOrState);
    getTransactionsSpy.mockResolvedValue(transactionsFromDataClientOrState);

    const service = mockTransactionService(network, dataClient);

    const filteredTransactions = transactionsFromDataClientOrState.filter(
      (tx) => service.hasMatchingContractOrIsDeploy(tx, contractAddress),
    );

    return {
      removeTransactionsSpy,
      findTransactionsSpy,
      getTransactionsSpy,
      service,
      transactionsFromDataClientOrState,
      filteredTransactions,
      network,
      address,
      contractAddress,
    };
  };

  describe('getTransactionsOnChain', () => {
    it('returns transactions on chain', async () => {
      const {
        service,
        getTransactionsSpy,
        filteredTransactions,
        address,
        contractAddress,
      } = await prepareGetTransactions();

      const transactions: Transaction[] = [];

      for await (const tx of service.getTransactionsOnChain(
        address,
        contractAddress,
        10,
      )) {
        transactions.push(tx);
      }

      expect(getTransactionsSpy).toHaveBeenCalledWith(
        address,
        expect.any(Number),
      );
      expect(transactions).toStrictEqual(filteredTransactions);
    });
  });

  describe('getTransactionsOnState', () => {
    it('returns transactions on state', async () => {
      const {
        service,
        findTransactionsSpy,
        filteredTransactions,
        network,
        address,
        contractAddress,
      } = await prepareGetTransactions();

      const transactions: Transaction[] = [];
      for await (const tx of service.getTransactionsOnState(
        address,
        contractAddress,
      )) {
        transactions.push(tx);
      }

      expect(findTransactionsSpy).toHaveBeenCalledWith({
        senderAddress: [address],
        chainId: [network.chainId],
        finalityStatus: [TransactionFinalityStatus.RECEIVED],
        dataVersion: [TransactionDataVersion.V2],
      });
      expect(transactions).toStrictEqual(filteredTransactions);
    });
  });

  describe('getTransactions', () => {
    it('returns and merge the transactions from chain and state', async () => {
      const {
        service,
        filteredTransactions: transactionsFromChain,
        findTransactionsSpy,
        network,
        address,
        contractAddress,
      } = await prepareGetTransactions();

      const lastTransactionFromChain =
        transactionsFromChain[transactionsFromChain.length - 1];
      const lastTransactionHashInBigInt = BigInt(
        lastTransactionFromChain.txnHash,
      );
      const transactionFromState = generateTransactions({
        cnt: 5,
        address,
        chainId: network.chainId,
        txnTypes: [TransactionType.INVOKE],
        // make sure the contract address is match to the given contract address, so we can merge it with the transactions from chain
        contractAddresses: [contractAddress],
        // make sure the txnHash is different with the transaction from chain
        baseTxnHashInBigInt: lastTransactionHashInBigInt * BigInt(2),
      });
      findTransactionsSpy.mockResolvedValue(transactionFromState);

      const result = await service.getTransactions(
        address,
        contractAddress,
        10,
      );

      const expectedResult = transactionFromState.concat(transactionsFromChain);

      expect(result).toStrictEqual(expectedResult);
    });

    it('remove the transactions that are already on chain', async () => {
      const {
        service,
        filteredTransactions: transactionsFromChain,
        removeTransactionsSpy,
        address,
        contractAddress,
        findTransactionsSpy,
      } = await prepareGetTransactions();

      const duplicatedTransactions = [
        transactionsFromChain[transactionsFromChain.length - 1],
      ];

      findTransactionsSpy.mockResolvedValue(duplicatedTransactions);

      await service.getTransactions(address, contractAddress, 10);

      expect(removeTransactionsSpy).toHaveBeenCalledWith({
        txnHash: [duplicatedTransactions[0].txnHash],
      });
    });
  });
});
