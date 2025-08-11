import type { Json } from '@metamask/snaps-sdk';
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

/**
 * Determines if the given error is a Snap RPC error.
 *
 * @param error - The error instance to be checked.
 * @returns A boolean indicating whether the error is a Snap RPC error.
 */
export function isSnapRpcError(error: Error): boolean {
  const errors = [
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
  return errors.some((errType) => error instanceof errType);
}

// The error code is following the Starknet Wallet RPC 0.7.2 specification.
export enum WalletRpcErrorCode {
  InvalidErc20 = 111,
  InvalidNetwork = 112,
  UserDeny = 113,
  InvalidRequest = 114,
  AccountAlreadyDeployed = 115,
  Unknown = 163,
}

/**
 * Creates a wallet RPC error wrapper for custom snap error.
 *
 * @param code - The `WalletRpcErrorCode` error code.
 * @param [data] - The error data.
 */
export function createWalletRpcErrorWrapper(
  code: WalletRpcErrorCode,
  data?: Record<string, Json>,
) {
  return {
    walletRpcError: {
      ...data,
      code,
    },
  };
}
