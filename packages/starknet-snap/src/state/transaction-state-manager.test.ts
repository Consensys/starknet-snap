import {
  TransactionType,
  constants,
  TransactionFinalityStatus,
  TransactionExecutionStatus,
} from 'starknet';

import { generateTransactions } from '../__tests__/helper';
import { PRELOADED_TOKENS } from '../utils/constants';
import { mockAcccounts, mockState } from './__tests__/helper';
import { StateManagerError } from './state-manager';
import { TransactionStateManager } from './transaction-state-manager';

describe('TransactionStateManager', () => {
  const prepareMockData = async (chainId) => {
    const accounts = await mockAcccounts(chainId, 1);
    const txns = generateTransactions({
      chainId,
      address: accounts[0].address,
      txnTypes: [
        TransactionType.DECLARE,
        TransactionType.DEPLOY_ACCOUNT,
        TransactionType.INVOKE,
      ],
      cnt: 10,
    });
    const { state, setDataSpy, getDataSpy } = await mockState({
      transactions: txns,
    });
    return {
      state,
      setDataSpy,
      getDataSpy,
      account: accounts[0],
      txns,
    };
  };

  describe('getTransaction', () => {
    it('returns the transaction', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const { txns } = await prepareMockData(chainId);

      const stateManager = new TransactionStateManager();
      const result = await stateManager.getTransaction({
        txnHash: txns[0].txnHash,
      });

      expect(result).toStrictEqual(txns[0]);
    });

    it('finds the transaction by chainId and txnHash', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const { txns } = await prepareMockData(chainId);

      const stateManager = new TransactionStateManager();
      const result = await stateManager.getTransaction({
        txnHash: txns[1].txnHash,
        chainId: txns[1].chainId,
      });

      expect(result).toStrictEqual(txns[1]);
    });

    it('returns null if the transaction can not be found', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const { txns } = await prepareMockData(chainId);

      const stateManager = new TransactionStateManager();

      const result = await stateManager.getTransaction({
        txnHash: txns[0].txnHash,
        chainId: constants.StarknetChainId.SN_MAIN,
      });
      expect(result).toBeNull();
    });
  });

  describe('findTransactions', () => {
    const prepareFindTransctions = async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const { txns } = await prepareMockData(chainId);
      const stateManager = new TransactionStateManager();
      return {
        stateManager,
        txns,
      };
    };

    it('returns the list of transaction by chain id', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const { txns, stateManager } = await prepareFindTransctions();

      const result = await stateManager.findTransactions({
        chainId: [chainId],
      });

      expect(result).toStrictEqual(
        txns.filter((txn) => txn.chainId === chainId),
      );
    });

    it('returns the list of transaction by txn hash', async () => {
      const { txns, stateManager } = await prepareFindTransctions();

      const result = await stateManager.findTransactions({
        txnHash: [txns[0].txnHash, txns[1].txnHash],
      });

      expect(result).toStrictEqual([txns[0], txns[1]]);
    });

    it('returns the list of transaction by txn type', async () => {
      const { txns, stateManager } = await prepareFindTransctions();

      const result = await stateManager.findTransactions({
        txnType: [TransactionType.DEPLOY_ACCOUNT],
      });

      expect(result).toStrictEqual([
        txns.find((txn) => txn.txnType === TransactionType.DEPLOY_ACCOUNT),
      ]);
    });

    it('returns the list of transaction by sender address', async () => {
      const { txns, stateManager } = await prepareFindTransctions();

      const result = await stateManager.findTransactions({
        senderAddress: [txns[0].senderAddress],
      });

      expect(result).toStrictEqual(txns);
    });

    it('returns the list of transaction by contract address', async () => {
      const { txns, stateManager } = await prepareFindTransctions();
      const tokenAddress1 = PRELOADED_TOKENS.map((token) => token.address)[0];
      const tokenAddress2 = PRELOADED_TOKENS.map((token) => token.address)[2];

      const result = await stateManager.findTransactions({
        contractAddress: [tokenAddress1, tokenAddress2],
      });

      expect(result).toStrictEqual(
        txns.filter(
          (txn) =>
            txn.contractAddress === tokenAddress1 ||
            txn.contractAddress === tokenAddress2,
        ),
      );
    });

    it('returns the list of transaction by timestamp if the transaction timestamp is >= the search timestamp', async () => {
      const { txns, stateManager } = await prepareFindTransctions();

      const result = await stateManager.findTransactions({
        // The timestamp from data source is in seconds, but we are comparing it in milliseconds
        timestamp: txns[5].timestamp * 1000,
      });

      expect(result).toStrictEqual(
        txns.filter((txn) => txn.timestamp >= txns[5].timestamp),
      );
    });

    it('returns the list of transaction by finalityStatus', async () => {
      const { txns, stateManager } = await prepareFindTransctions();
      const finalityStatusCond = [
        TransactionFinalityStatus.ACCEPTED_ON_L1,
        TransactionFinalityStatus.ACCEPTED_ON_L2,
      ];

      const result = await stateManager.findTransactions({
        finalityStatus: finalityStatusCond,
      });

      expect(result).toStrictEqual(
        txns.filter((txn) => {
          return finalityStatusCond.includes(
            txn.finalityStatus as unknown as TransactionFinalityStatus,
          );
        }),
      );
    });

    it('returns the list of transaction by executionStatus', async () => {
      const { txns, stateManager } = await prepareFindTransctions();
      const executionStatusCond = [TransactionExecutionStatus.REJECTED];

      const result = await stateManager.findTransactions({
        executionStatus: executionStatusCond,
      });

      expect(result).toStrictEqual(
        txns.filter((txn) => {
          return executionStatusCond.includes(
            txn.executionStatus as unknown as TransactionExecutionStatus,
          );
        }),
      );
    });

    it('returns the list of transaction by mutilple conditions', async () => {
      const { txns, stateManager } = await prepareFindTransctions();
      const finalityStatusCond = [
        TransactionFinalityStatus.ACCEPTED_ON_L1,
        TransactionFinalityStatus.ACCEPTED_ON_L2,
      ];
      const executionStatusCond = [
        TransactionExecutionStatus.REVERTED,
        TransactionExecutionStatus.SUCCEEDED,
        TransactionExecutionStatus.REJECTED,
      ];
      const contractAddressCond = [
        PRELOADED_TOKENS.map((token) => token.address)[0],
      ];
      const timestampCond = txns[5].timestamp * 1000;
      const chainIdCond = [
        txns[0].chainId as unknown as constants.StarknetChainId,
      ];

      const result = await stateManager.findTransactions({
        chainId: chainIdCond,
        finalityStatus: finalityStatusCond,
        executionStatus: executionStatusCond,
        timestamp: timestampCond,
        contractAddress: contractAddressCond,
        senderAddress: [txns[0].senderAddress],
      });

      expect(result).toStrictEqual(
        txns.filter((txn) => {
          return (
            (finalityStatusCond.includes(
              txn.finalityStatus as unknown as TransactionFinalityStatus,
            ) ||
              executionStatusCond.includes(
                txn.executionStatus as unknown as TransactionExecutionStatus,
              )) &&
            txn.timestamp >= txns[5].timestamp &&
            contractAddressCond.includes(txn.contractAddress) &&
            chainIdCond.includes(
              txn.chainId as unknown as constants.StarknetChainId,
            ) &&
            txn.senderAddress === txns[0].senderAddress
          );
        }),
      );
    });

    it('returns empty array if none of the transaction found', async () => {
      const { stateManager } = await prepareFindTransctions();

      const result = await stateManager.findTransactions({
        chainId: ['0x1' as unknown as constants.StarknetChainId],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('updateTransaction', () => {
    it('updates the transaction', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const { txns, state } = await prepareMockData(chainId);

      const stateManager = new TransactionStateManager();
      const txn = txns[2];
      const updatedEntity = {
        ...txn,
        executionStatus: TransactionExecutionStatus.REJECTED,
        finalityStatus: TransactionFinalityStatus.ACCEPTED_ON_L1,
        timestamp: Math.floor(Date.now() / 1000),
      };
      await stateManager.updateTransaction(updatedEntity);

      expect(
        state.transactions.find(
          (transaction) => transaction.txnHash === txn.txnHash,
        ),
      ).toStrictEqual(updatedEntity);
    });

    it('throws `Transaction does not exist` error if the update entity can not be found', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const { txns } = await prepareMockData(chainId);

      const stateManager = new TransactionStateManager();
      const txn = txns[2];
      const updatedEntity = {
        ...txn,
        timestamp: Math.floor(Date.now() / 1000),
        txnHash: '0x123',
      };

      await expect(
        stateManager.updateTransaction(updatedEntity),
      ).rejects.toThrow('Transaction does not exist');
    });
  });

  describe('removeTransactions', () => {
    it('removes the transaction', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const { txns, state } = await prepareMockData(chainId);
      const txnHashCond = [txns[2].txnHash, txns[1].txnHash];

      const stateManager = new TransactionStateManager();

      await stateManager.removeTransactions({
        txnHash: txnHashCond,
      });

      expect(
        state.transactions.filter((txn) => txnHashCond.includes(txn.txnHash)),
      ).toStrictEqual([]);
    });

    it('throws a `StateManagerError` error if an error was thrown', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const { txns, setDataSpy } = await prepareMockData(chainId);
      setDataSpy.mockRejectedValue(new Error('Error'));
      const txnHashCond = [txns[2].txnHash, txns[1].txnHash];

      const stateManager = new TransactionStateManager();

      await expect(
        stateManager.removeTransactions({
          txnHash: txnHashCond,
        }),
      ).rejects.toThrow(StateManagerError);
    });
  });

  describe('addTransaction', () => {
    it('adds a transaction', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const {
        txns: [txnToBeAdded, ...txns],
        getDataSpy,
        state,
      } = await prepareMockData(chainId);
      getDataSpy.mockResolvedValue({
        transactions: txns,
      });

      const stateManager = new TransactionStateManager();

      await stateManager.addTransaction(txnToBeAdded);

      expect(
        state.transactions.find((txn) => txn.txnHash === txnToBeAdded.txnHash),
      ).toStrictEqual(txnToBeAdded);
    });

    it('throws a `Transaction already exist` error if the transaction is exist', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const { txns } = await prepareMockData(chainId);

      const stateManager = new TransactionStateManager();

      await expect(stateManager.addTransaction(txns[0])).rejects.toThrow(
        'Transaction already exist',
      );
    });
  });
});
