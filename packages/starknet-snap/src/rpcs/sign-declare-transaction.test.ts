import type { DeclareSignerDetails } from 'starknet';
import { constants } from 'starknet';

import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import {
  mockAccount,
  prepareMockAccount,
  prepareRenderSignDeclareTransactionUI,
} from './__tests__/helper';
import { signDeclareTransaction } from './sign-declare-transaction';
import type { SignDeclareTransactionParams } from './sign-declare-transaction';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('signDeclareTransaction', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const createRequest = (
    chainId: constants.StarknetChainId,
    address: string,
  ) => ({
    details: {
      classHash:
        '0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
      senderAddress: address,
      chainId,
      version: constants.TRANSACTION_VERSION.V2,
      maxFee: 0,
      nonce: 0,
    },
    address,
    chainId,
  });

  it('signs message correctly', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);

    prepareMockAccount(account, state);
    prepareRenderSignDeclareTransactionUI();

    const request = createRequest(chainId, account.address);

    const expectedResult = await starknetUtils.signDeclareTransaction(
      account.privateKey,
      request.details as unknown as DeclareSignerDetails,
    );

    const result = await signDeclareTransaction.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    const { address } = account;

    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareRenderSignDeclareTransactionUI();

    const request = createRequest(chainId, address);

    await signDeclareTransaction.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledWith({
      senderAddress: address,
      chainId,
      networkName: STARKNET_SEPOLIA_TESTNET_NETWORK.name,
      declareTransactions: request.details,
    });
  });

  it('throws `UserRejectedOpError` if user denied the operation', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);

    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareRenderSignDeclareTransactionUI();

    confirmDialogSpy.mockResolvedValue(false);

    const request = createRequest(chainId, account.address);

    await expect(signDeclareTransaction.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      signDeclareTransaction.execute(
        {} as unknown as SignDeclareTransactionParams,
      ),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
