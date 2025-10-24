import type { constants } from 'starknet';

import typedDataExample from '../__tests__/fixture/typedDataExample.json';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import {
  setupAccountController,
  mockRenderSignMessageUI,
} from './__tests__/helper';
import { signMessage } from './sign-message';
import type { SignMessageParams } from './sign-message';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('signMessage', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const setupSignMessageTest = async (enableAuthorize = false) => {
    const { account } = await setupAccountController({
      network,
    });

    const { confirmDialogSpy } = mockRenderSignMessageUI();

    const request = {
      chainId: network.chainId as constants.StarknetChainId,
      address: account.address,
      typedDataMessage: typedDataExample,
      enableAuthorize,
    };

    return {
      request,
      account,
      confirmDialogSpy,
    };
  };

  it('signs message correctly', async () => {
    const { account, request } = await setupSignMessageTest();

    const expectedResult = await starknetUtils.signMessage(
      account.privateKey,
      typedDataExample,
      account.address,
    );

    const result = await signMessage.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const { account, request, confirmDialogSpy } = await setupSignMessageTest(
      true,
    );

    await signMessage.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledWith({
      address: account.address,
      chainId: network.chainId as constants.StarknetChainId,
      typedDataMessage: typedDataExample,
    });
  });

  it('throws `UserRejectedOpError` if user denied the operation', async () => {
    const { request, confirmDialogSpy } = await setupSignMessageTest(true);

    confirmDialogSpy.mockResolvedValue(false);

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
