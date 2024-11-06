import { text, MethodNotFoundError, SnapError } from '@metamask/snaps-sdk';

import { onHomePage, onRpcRequest } from '.';
import * as createAccountApi from './createAccount';
import { HomePageController } from './on-home-page';
import * as keyPairUtils from './utils/keyPair';

jest.mock('./utils/logger');

describe('onRpcRequest', () => {
  const createMockSpy = () => {
    const createAccountSpy = jest.spyOn(createAccountApi, 'createAccount');
    const keyPairSpy = jest.spyOn(keyPairUtils, 'getAddressKeyDeriver');
    return {
      createAccountSpy,
      keyPairSpy,
    };
  };

  const createMockRequest = (params = {}) => {
    return {
      origin: 'http://localhost:3000',
      request: {
        method: 'starkNet_createAccount',
        params,
        jsonrpc: '2.0' as const,
        id: 1,
      },
    };
  };

  it('processes request successfully', async () => {
    const { createAccountSpy, keyPairSpy } = createMockSpy();

    createAccountSpy.mockReturnThis();
    keyPairSpy.mockReturnThis();

    await onRpcRequest(createMockRequest());

    expect(keyPairSpy).toHaveBeenCalledTimes(1);
    expect(createAccountSpy).toHaveBeenCalledTimes(1);
  });

  it('throws `MethodNotFoundError` if the request method not found', async () => {
    await expect(
      onRpcRequest({
        ...createMockRequest(),
        request: {
          ...createMockRequest().request,
          method: 'method_not_found',
        },
      }),
    ).rejects.toThrow(MethodNotFoundError);
  });

  it('throws `SnapError` if the error is an instance of SnapError', async () => {
    const { createAccountSpy } = createMockSpy();
    createAccountSpy.mockRejectedValue(new SnapError('error'));

    await expect(onRpcRequest(createMockRequest())).rejects.toThrow(SnapError);
  });

  it('throws `SnapError` if the error is not an instance of SnapError', async () => {
    const { createAccountSpy } = createMockSpy();
    createAccountSpy.mockRejectedValue(new Error('error'));

    await expect(onRpcRequest(createMockRequest())).rejects.toThrow(SnapError);
  });
});

describe('onHomePage', () => {
  it('executes homePageController', async () => {
    const executeSpy = jest.spyOn(HomePageController.prototype, 'execute');
    executeSpy.mockResolvedValue({ content: text('test') });

    const result = await onHomePage();

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({
      content: {
        type: 'text',
        value: 'test',
      },
    });
  });
});
