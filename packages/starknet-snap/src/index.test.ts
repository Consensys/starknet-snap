import { onRpcRequest } from '.';
import * as createAccountApi from './createAccount';
import * as keyPairUtils from './utils/keyPair';
import { LogLevel, logger } from './utils/logger';

jest.mock('./utils/logger');

describe('onRpcRequest', function () {
  const createMockSpy = () => {
    const createAccountSpy = jest.spyOn(createAccountApi, 'createAccount');
    const keyPairSpy = jest.spyOn(keyPairUtils, 'getAddressKeyDeriver');
    const getLogLevelSpy = jest.spyOn(logger, 'getLogLevel');
    return {
      createAccountSpy,
      keyPairSpy,
      getLogLevelSpy,
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

  it('processes request successfully', async function () {
    const { createAccountSpy, keyPairSpy, getLogLevelSpy } = createMockSpy();

    createAccountSpy.mockReturnThis();
    keyPairSpy.mockReturnThis();
    getLogLevelSpy.mockReturnValue(LogLevel.OFF);

    await onRpcRequest(createMockRequest());

    expect(keyPairSpy).toHaveBeenCalledTimes(1);
    expect(createAccountSpy).toHaveBeenCalledTimes(1);
  });

  it('throws `Unable to execute the rpc request` error if an error has thrown and `LogLevel` is `OFF`', async function () {
    const { createAccountSpy, keyPairSpy, getLogLevelSpy } = createMockSpy();

    createAccountSpy.mockRejectedValue(new Error('Custom Error'));
    keyPairSpy.mockReturnThis();
    getLogLevelSpy.mockReturnValue(LogLevel.OFF);

    await expect(onRpcRequest(createMockRequest())).rejects.toThrow(
      'Unable to execute the rpc request',
    );
  });

  it.each([
    LogLevel.DEBUG,
    LogLevel.ALL,
    LogLevel.ERROR,
    LogLevel.INFO,
    LogLevel.TRACE,
    LogLevel.WARN,
  ])(
    `throws 'Unable to execute the rpc request' error if an error has thrown and LogLevel is %s`,
    async function (logLevel) {
      const { createAccountSpy, keyPairSpy, getLogLevelSpy } = createMockSpy();

      createAccountSpy.mockRejectedValue(new Error('Custom Error'));
      keyPairSpy.mockReturnThis();
      getLogLevelSpy.mockReturnValue(logLevel);

      await expect(
        onRpcRequest(
          createMockRequest({
            debugLevel: LogLevel[logLevel],
          }),
        ),
      ).rejects.toThrow('Custom Error');
    },
  );
});
