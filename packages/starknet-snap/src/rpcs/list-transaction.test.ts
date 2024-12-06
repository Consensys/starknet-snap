import type { constants } from 'starknet';

import { generateTransactions } from '../__tests__/helper';
import type { IDataClient } from '../chain/data-client';
import { TransactionService } from '../chain/transaction-service';
import { Config } from '../config';
import {
  ETHER_SEPOLIA_TESTNET,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import * as factory from '../utils/factory';
import { mockAccount } from './__tests__/helper';
import { ListTransactions } from './list-transactions';
import type { ListTransactionsParams } from './list-transactions';

jest.mock('../utils/logger');

describe('listTransactions', () => {
  const prepareListTransactions = async () => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const chainId = network.chainId as unknown as constants.StarknetChainId;
    const account = await mockAccount(chainId);
    const transactions = generateTransactions({
      chainId,
      address: account.address,
      cnt: 10,
    });

    // Mock the factory to by pass the validation of create transaction service
    jest.spyOn(factory, 'createTransactionService').mockReturnValue(
      new TransactionService({
        network,
        dataClient: {} as unknown as IDataClient,
      }),
    );

    const getTransactionsSpy = jest.spyOn(
      TransactionService.prototype,
      'getTransactions',
    );
    getTransactionsSpy.mockResolvedValue(transactions);

    return { transactions, getTransactionsSpy, account, chainId };
  };

  it('returns transactions', async () => {
    const { transactions, getTransactionsSpy, chainId, account } =
      await prepareListTransactions();

    const result = await ListTransactions.execute({
      chainId,
      senderAddress: account.address,
      contractAddress: ETHER_SEPOLIA_TESTNET.address,
      txnsInLastNumOfDays: 1,
    });

    expect(getTransactionsSpy).toHaveBeenCalledWith(
      account.address,
      ETHER_SEPOLIA_TESTNET.address,
      1,
    );
    expect(result).toStrictEqual(transactions);
  });

  it('fetchs transactions with config value if input `txnsInLastNumOfDays` has not given', async () => {
    const { getTransactionsSpy, chainId, account } =
      await prepareListTransactions();

    await ListTransactions.execute({
      chainId,
      senderAddress: account.address,
      contractAddress: ETHER_SEPOLIA_TESTNET.address,
    });

    expect(getTransactionsSpy).toHaveBeenCalledWith(
      account.address,
      ETHER_SEPOLIA_TESTNET.address,
      Config.transaction.list.txnsInLastNumOfDays,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      ListTransactions.execute({} as unknown as ListTransactionsParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
