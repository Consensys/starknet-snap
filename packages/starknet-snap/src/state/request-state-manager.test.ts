import { constants } from 'starknet';

import { generateTransactionRequests } from '../__tests__/helper';
import type { TransactionRequest } from '../types/snapState';
import { mockAcccounts, mockState } from './__tests__/helper';
import { TransactionRequestStateManager } from './request-state-manager';
import { StateManagerError } from './state-manager';

describe('TransactionRequestStateManager', () => {
  const getChainId = () => constants.StarknetChainId.SN_SEPOLIA;

  const prepareMockData = async () => {
    const chainId = getChainId();
    const accounts = await mockAcccounts(chainId, 1);
    const transactionRequests = generateTransactionRequests({
      chainId,
      address: accounts[0].address,
      cnt: 10,
    });

    const { state, setDataSpy, getDataSpy } = await mockState({
      transactionRequests,
    });

    return {
      state,
      setDataSpy,
      getDataSpy,
      account: accounts[0],
      transactionRequests,
    };
  };

  const getNewEntity = (address) => {
    const chainId = getChainId();
    const transactionRequests = generateTransactionRequests({
      chainId,
      address,
      cnt: 1,
    });

    return transactionRequests[0];
  };

  const getUpdateEntity = (request: TransactionRequest) => {
    return {
      ...request,
      maxFee: '999999',
    };
  };

  describe('getTransactionRequest', () => {
    it('returns the transaction request', async () => {
      const {
        transactionRequests: [transactionRequest],
      } = await prepareMockData();

      const stateManager = new TransactionRequestStateManager();
      const result = await stateManager.getTransactionRequest({
        requestId: transactionRequest.id,
      });

      expect(result).toStrictEqual(transactionRequest);
    });

    it('finds the request by interfaceId', async () => {
      const {
        transactionRequests: [transactionRequest],
      } = await prepareMockData();

      const stateManager = new TransactionRequestStateManager();
      const result = await stateManager.getTransactionRequest({
        interfaceId: transactionRequest.interfaceId,
      });

      expect(result).toStrictEqual(transactionRequest);
    });

    it('returns null if the transaction request can not be found', async () => {
      await prepareMockData();

      const stateManager = new TransactionRequestStateManager();

      const result = await stateManager.getTransactionRequest({
        requestId: 'something',
      });
      expect(result).toBeNull();
    });

    it('throws a `At least one search condition must be provided` error if no search criteria given', async () => {
      const stateManager = new TransactionRequestStateManager();

      await expect(stateManager.getTransactionRequest({})).rejects.toThrow(
        'At least one search condition must be provided',
      );
    });
  });

  describe('upsertTransactionRequest', () => {
    it('updates the transaction request if the transaction request found', async () => {
      const {
        state,
        transactionRequests: [transactionRequest],
      } = await prepareMockData();
      const entity = getUpdateEntity(transactionRequest);

      const stateManager = new TransactionRequestStateManager();
      await stateManager.upsertTransactionRequest(entity);

      expect(
        state.transactionRequests.find(
          (req) => req.id === transactionRequest.id,
        ),
      ).toStrictEqual(entity);
    });

    it('add a new transaction request if the transaction request does not found', async () => {
      const { state, account } = await prepareMockData();
      const entity = getNewEntity(account.address);
      const orgLength = state.transactionRequests.length;

      const stateManager = new TransactionRequestStateManager();
      await stateManager.upsertTransactionRequest(entity);

      expect(state.transactionRequests).toHaveLength(orgLength + 1);
      expect(
        state.transactionRequests.find((req) => req.id === entity.id),
      ).toStrictEqual(entity);
    });

    it('throws a `StateManagerError` error if an error was thrown', async () => {
      const { account, setDataSpy } = await prepareMockData();
      const entity = getNewEntity(account.address);
      setDataSpy.mockRejectedValue(new Error('Error'));

      const stateManager = new TransactionRequestStateManager();

      await expect(
        stateManager.upsertTransactionRequest(entity),
      ).rejects.toThrow(StateManagerError);
    });
  });

  describe('removeTransactionRequests', () => {
    it('removes the request', async () => {
      const {
        transactionRequests: [{ id }],
        state,
      } = await prepareMockData();
      const stateManager = new TransactionRequestStateManager();

      await stateManager.removeTransactionRequest(id);

      expect(
        state.transactionRequests.filter((req) => req.id === id),
      ).toStrictEqual([]);
    });

    it('throws a `StateManagerError` error if an error was thrown', async () => {
      const {
        transactionRequests: [{ id }],
        setDataSpy,
      } = await prepareMockData();
      setDataSpy.mockRejectedValue(new Error('Error'));

      const stateManager = new TransactionRequestStateManager();

      await expect(stateManager.removeTransactionRequest(id)).rejects.toThrow(
        StateManagerError,
      );
    });
  });
});
