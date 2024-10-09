import {
  InvalidParamsError,
  SnapError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';

import { createWalletRpcErrorWrapper, WalletRpcErrorCode } from './error';

// Extend SnapError to allow error message visible to client
export class UpgradeRequiredError extends SnapError {
  constructor(message?: string) {
    super(message ?? 'Upgrade required');
  }
}

export class DeployRequiredError extends SnapError {
  constructor(message?: string) {
    super(
      message ??
        'Cairo 0 contract address balance is not empty, deploy required',
    );
  }
}

export class InvalidNetworkError extends SnapError {
  constructor(message?: string) {
    super(
      message ?? 'Network not Supported',
      createWalletRpcErrorWrapper(WalletRpcErrorCode.InvalidNetwork),
    );
  }
}

export class UserRejectedOpError extends UserRejectedRequestError {
  constructor(message?: string) {
    super(message, createWalletRpcErrorWrapper(WalletRpcErrorCode.UserDeny));
  }
}

export class InvalidRequestParamsError extends InvalidParamsError {
  constructor(message?: string) {
    super(
      message,
      createWalletRpcErrorWrapper(WalletRpcErrorCode.InvalidRequest),
    );
  }
}

export class UnknownError extends SnapError {
  constructor(message?: string) {
    super(
      message ?? 'Unknown Error',
      createWalletRpcErrorWrapper(WalletRpcErrorCode.Unknown),
    );
  }
}
