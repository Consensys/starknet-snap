import { createStarkError, CustomError, WalletRpcError, defaultErrorMessage, defaultErrorCode } from './error';

describe('createStarkError', () => {
  it.each(
    Object.entries(WalletRpcError).map(([code, message]) => ({
      code: parseInt(code, 10),
      message,
    })),
  )('returns corresponding error if the error code is $code', ({ code, message }) => {
    const error = createStarkError(code);
    expect(error).toBeInstanceOf(CustomError);
    expect(error.message).toStrictEqual(message);
    expect(error.code).toStrictEqual(code);
  });

  it('returns default error code and message if the error code is undefined', () => {
    const error = createStarkError(undefined);
    expect(error).toBeInstanceOf(CustomError);
    expect(error.message).toStrictEqual(defaultErrorMessage);
    expect(error.code).toStrictEqual(defaultErrorCode);
  });

  it('returns default error code and message if the error code is not exist in the mapping', () => {
    const error = createStarkError(0);
    expect(error).toBeInstanceOf(CustomError);
    expect(error.message).toStrictEqual(defaultErrorMessage);
    expect(error.code).toStrictEqual(defaultErrorCode);
  });
});
