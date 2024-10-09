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

import {
  createWalletRpcErrorWrapper,
  isSnapRpcError,
  WalletRpcErrorCode,
} from './error';
import {
  InvalidNetworkError,
  UnknownError,
  UserRejectedOpError,
  InvalidRequestParamsError,
} from './exceptions';

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

    const customSnapErrors = [
      InvalidNetworkError,
      UserRejectedOpError,
      UnknownError,
      InvalidRequestParamsError,
    ];

    for (const ErrorCtor of [...snapErrors, ...customSnapErrors]) {
      const error = new ErrorCtor('snap error message');
      expect(isSnapRpcError(error)).toBe(true);
    }
  });

  it('returns false for a non-Snap RPC error', () => {
    const error = new Error('error message');
    expect(isSnapRpcError(error)).toBe(false);
  });
});

describe('createWalletRpcErrorWrapper', () => {
  it('returns a serialized SnapError', () => {
    const wrapper = createWalletRpcErrorWrapper(
      WalletRpcErrorCode.InvalidRequest,
      { someData: 'data' },
    );

    expect(wrapper).toStrictEqual({
      walletRpcError: {
        someData: 'data',
        code: WalletRpcErrorCode.InvalidRequest,
      },
    });
  });
});
