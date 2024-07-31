import {
  MethodNotFoundError,
  UserRejectedRequestError,
  MethodNotSupportedError,
  ParseError,
  ResourceNotFoundError,
  ResourceUnavailableError,
  TransactionRejected,
  ChainDisconnectedError,
  DisconnectedError,
  UnauthorizedError,
  UnsupportedMethodError,
  InternalError,
  InvalidInputError,
  InvalidParamsError,
  InvalidRequestError,
  LimitExceededError,
  SnapError,
} from '@metamask/snaps-sdk';

import { CustomError, isSnapRpcError } from './error';

describe('CustomError', () => {
  it('creates a custom error', () => {
    const customError = new CustomError('custom error message');
    expect(customError).toBeInstanceOf(Error);
    expect(customError).toBeInstanceOf(CustomError);
    expect(customError.message).toBe('custom error message');
    expect(customError.name).toBe('CustomError');
  });
});

describe('isSnapRpcError', () => {
  it('returns true for a Snap RPC error', () => {
    const snapErrors = [
      SnapError,
      MethodNotFoundError,
      UserRejectedRequestError,
      MethodNotSupportedError,
      ParseError,
      ResourceNotFoundError,
      ResourceUnavailableError,
      TransactionRejected,
      ChainDisconnectedError,
      DisconnectedError,
      UnauthorizedError,
      UnsupportedMethodError,
      InternalError,
      InvalidInputError,
      InvalidParamsError,
      InvalidRequestError,
      LimitExceededError,
    ];

    for (const ErrorCtor of snapErrors) {
      const error = new ErrorCtor('snap error message');
      expect(isSnapRpcError(error)).toBe(true);
    }
  });

  it('returns false for a non-Snap RPC error', () => {
    const error = new Error('error message');
    expect(isSnapRpcError(error)).toBe(false);
  });
});
