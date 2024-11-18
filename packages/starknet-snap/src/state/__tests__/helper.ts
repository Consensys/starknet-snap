import type { constants } from 'starknet';

import { generateAccounts, type StarknetAccount } from '../../__tests__/helper';
import type {
  Erc20Token,
  Network,
  Transaction,
  TransactionRequest,
} from '../../types/snapState';
import * as snapHelper from '../../utils/snap';

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
