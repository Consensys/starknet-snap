import { createStarkError, WalletRpcError, WalletRpcErrorMap, defaultErrorMessage, defaultErrorCode } from './error';

describe('createStarkError', () => {
  it.each(
    Object.entries(WalletRpcErrorMap).map(([code, message]) => ({
      code: parseInt(code, 10),
      message,
    })),
  )('returns corresponding error if the error code is $code', ({ code, message }) => {
    const error = createStarkError(code);
    expect(error).toBeInstanceOf(WalletRpcError);
    expect(error.message).toStrictEqual(message);
    expect(error.code).toStrictEqual(code);
  });

  it('returns default error code and message if the error code is undefined', () => {
    const error = createStarkError(undefined);
    expect(error).toBeInstanceOf(WalletRpcError);
    expect(error.message).toStrictEqual(defaultErrorMessage);
    expect(error.code).toStrictEqual(defaultErrorCode);
  });

  it('returns default error code and message if the error code does not exist in the mapping', () => {
    const error = createStarkError(0);
    expect(error).toBeInstanceOf(WalletRpcError);
    expect(error.message).toStrictEqual(defaultErrorMessage);
    expect(error.code).toStrictEqual(defaultErrorCode);
  });
});
