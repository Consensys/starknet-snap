import { constants } from 'starknet';

import typedDataExample from '../__tests__/fixture/typedDataExample.json';
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
  prepareRenderSignMessageUI,
} from './__tests__/helper';
import { signMessage } from './sign-message';
import type { SignMessageParams } from './sign-message';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('signMessage', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  it('signs message correctly', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    prepareRenderSignMessageUI();

    const expectedResult = await starknetUtils.signMessage(
      account.privateKey,
      typedDataExample,
      account.address,
    );

    const request = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      typedDataMessage: typedDataExample,
    };
    const result = await signMessage.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
    const { address, chainId } = account;

    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareRenderSignMessageUI();

    const request = {
      chainId: chainId as constants.StarknetChainId,
      address,
      typedDataMessage: typedDataExample,
      enableAuthorize: true,
    };

    await signMessage.execute(request);
    expect(confirmDialogSpy).toHaveBeenCalledWith({
      address,
      chainId,
      typedDataMessage: typedDataExample,
    });
  });

  it('throws `UserRejectedOpError` if user denied the operation', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);

    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareRenderSignMessageUI();

    confirmDialogSpy.mockResolvedValue(false);

    const request = {
      chainId: constants.StarknetChainId.SN_SEPOLIA,
      address: account.address,
      typedDataMessage: typedDataExample,
      enableAuthorize: true,
    };

    await expect(signMessage.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      signMessage.execute({} as unknown as SignMessageParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
