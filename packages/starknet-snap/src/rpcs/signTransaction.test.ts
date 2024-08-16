import type { InvocationsSignerDetails } from 'starknet';
import { constants } from 'starknet';

import type { StarknetAccount } from '../../test/utils';
import { generateAccounts } from '../../test/utils';
import transactionExample from '../__tests__/fixture/transactionExample.json'; // Assuming you have a similar fixture
import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import * as snapHelper from '../utils/snap';
import * as snapUtils from '../utils/snapUtils';
import * as starknetUtils from '../utils/starknetUtils';
import { signTransaction } from './signTransaction';
import type { SignTransactionParams } from './signTransaction';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('signTransaction', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const mockAccount = async (network: constants.StarknetChainId) => {
    const accounts = await generateAccounts(network, 1);
    return accounts[0];
  };

  const prepareSignTransactionMock = async (account: StarknetAccount) => {
    const getStateDataSpy = jest.spyOn(snapHelper, 'getStateData');
    const verifyIfAccountNeedUpgradeOrDeploySpy = jest.spyOn(
      snapUtils,
      'verifyIfAccountNeedUpgradeOrDeploy',
    );
    const getKeysFromAddressSpy = jest.spyOn(
      starknetUtils,
      'getKeysFromAddress',
    );
    const confirmDialogSpy = jest.spyOn(snapHelper, 'confirmDialog');

    getKeysFromAddressSpy.mockResolvedValue({
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      addressIndex: account.addressIndex,
      derivationPath: account.derivationPath as unknown as any,
    });

    verifyIfAccountNeedUpgradeOrDeploySpy.mockReturnThis();
    confirmDialogSpy.mockResolvedValue(true);
    getStateDataSpy.mockResolvedValue(state);

    return {
      getKeysFromAddressSpy,
      verifyIfAccountNeedUpgradeOrDeploySpy,
      confirmDialogSpy,
    };
  };

  it('signs a transaction from a user account correctly', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    await prepareSignTransactionMock(account);

    const expectedResult = await starknetUtils.signTransactions(
      account.privateKey,
      transactionExample.transactions,
      transactionExample.transactionsDetail as InvocationsSignerDetails,
    );

    const request: SignTransactionParams = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      transactions: transactionExample.transactions,
      transactionsDetail: transactionExample.transactionsDetail,
    };
    const result = await signTransaction.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('throws an error if signTransaction fails', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    const { getKeysFromAddressSpy } = await prepareSignTransactionMock(account);

    getKeysFromAddressSpy.mockRejectedValue(
      new Error('Failed to execute the rpc method'),
    );

    const request: SignTransactionParams = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      transactions: transactionExample.transactions,
      transactionsDetail: transactionExample.transactionsDetail,
    };

    await expect(signTransaction.execute(request)).rejects.toThrow(
      'Failed to execute the rpc method',
    );
  });

  it('throws an error if the user denies the transaction signing', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    const { confirmDialogSpy } = await prepareSignTransactionMock(account);

    confirmDialogSpy.mockResolvedValue(false);

    const request: SignTransactionParams = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      transactions: transactionExample.transactions,
      transactionsDetail: transactionExample.transactionsDetail,
      enableAuthorize: true,
    };

    await expect(signTransaction.execute(request)).rejects.toThrow(
      'User rejected the request.',
    );
  });

  it('skips the dialog if enableAuthorize is false', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    const { confirmDialogSpy } = await prepareSignTransactionMock(account);

    const expectedResult = await starknetUtils.signTransactions(
      account.privateKey,
      transactionExample.transactions,
      transactionExample.transactionsDetail as InvocationsSignerDetails,
    );

    const request: SignTransactionParams = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      transactions: transactionExample.transactions,
      transactionsDetail: transactionExample.transactionsDetail,
      enableAuthorize: false,
    };

    const result = await signTransaction.execute(request);

    expect(confirmDialogSpy).not.toHaveBeenCalled();
    expect(result).toStrictEqual(expectedResult);
  });

  it('skips the dialog if enableAuthorize is omitted', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    const { confirmDialogSpy } = await prepareSignTransactionMock(account);

    const expectedResult = await starknetUtils.signTransactions(
      account.privateKey,
      transactionExample.transactions,
      transactionExample.transactionsDetail as InvocationsSignerDetails,
    );

    const request: SignTransactionParams = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      transactions: transactionExample.transactions,
      transactionsDetail: transactionExample.transactionsDetail,
    };

    const result = await signTransaction.execute(request);

    expect(confirmDialogSpy).not.toHaveBeenCalled();
    expect(result).toStrictEqual(expectedResult);
  });
});
