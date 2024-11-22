import type { constants } from 'starknet';

import { generateAccounts, type StarknetAccount } from '../../__tests__/helper';
import type {
  Erc20Token,
  Network,
  Transaction,
  TransactionRequest,
} from '../../types/snapState';
import {
  ETHER_SEPOLIA_TESTNET,
  STRK_SEPOLIA_TESTNET,
} from '../../utils/constants';
import * as snapHelper from '../../utils/snap';
import { NetworkStateManager } from '../network-state-manager';
import { TransactionRequestStateManager } from '../request-state-manager';
import { TokenStateManager } from '../token-state-manager';

jest.mock('../../utils/snap');
jest.mock('../../utils/logger');

export const mockAcccounts = async (
  chainId: constants.StarknetChainId,
  cnt = 10,
) => {
  return generateAccounts(chainId, cnt);
};

export const mockState = async ({
  accounts,
  tokens,
  networks,
  transactions,
  currentNetwork,
  transactionRequests,
}: {
  accounts?: StarknetAccount[];
  tokens?: Erc20Token[];
  networks?: Network[];
  transactions?: Transaction[];
  currentNetwork?: Network;
  transactionRequests?: TransactionRequest[];
}) => {
  const getDataSpy = jest.spyOn(snapHelper, 'getStateData');
  const setDataSpy = jest.spyOn(snapHelper, 'setStateData');
  const state = {
    accContracts: accounts,
    erc20Tokens: tokens ?? [],
    networks: networks ?? [],
    transactions: transactions ?? [],
    currentNetwork,
    transactionRequests: transactionRequests ?? [],
  };
  getDataSpy.mockResolvedValue(state);
  return {
    getDataSpy,
    setDataSpy,
    state,
  };
};

export const mockTokenStateManager = () => {
  const getEthTokenSpy = jest.spyOn(TokenStateManager.prototype, 'getEthToken');
  const getStrkTokenSpy = jest.spyOn(
    TokenStateManager.prototype,
    'getStrkToken',
  );
  getStrkTokenSpy.mockResolvedValue(STRK_SEPOLIA_TESTNET);
  getEthTokenSpy.mockResolvedValue(ETHER_SEPOLIA_TESTNET);

  return {
    getEthTokenSpy,
    getStrkTokenSpy,
  };
};

export const mockTransactionRequestStateManager = () => {
  const upsertTransactionRequestSpy = jest.spyOn(
    TransactionRequestStateManager.prototype,
    'upsertTransactionRequest',
  );
  const getTransactionRequestSpy = jest.spyOn(
    TransactionRequestStateManager.prototype,
    'getTransactionRequest',
  );
  const removeTransactionRequestSpy = jest.spyOn(
    TransactionRequestStateManager.prototype,
    'removeTransactionRequest',
  );

  return {
    upsertTransactionRequestSpy,
    getTransactionRequestSpy,
    removeTransactionRequestSpy,
  };
};

export const mockNetworkStateManager = (network: Network) => {
  const getNetworkSpy = jest.spyOn(NetworkStateManager.prototype, 'getNetwork');
  getNetworkSpy.mockResolvedValue(network);
  return {
    getNetworkSpy,
  };
};
