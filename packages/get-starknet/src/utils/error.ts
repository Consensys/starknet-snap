// The error code is following the Starknet Wallet RPC 0.7.2 specification.
export enum WalletRpcErrorCode {
  InvalidErc20 = 111,
  InvalidNetwork = 112,
  UserDeny = 113,
  InvalidRequest = 114,
  AccountAlreadyDeployed = 115,
  ApiVersionNotSupported = 162,
  Unknown = 163,
}

// Here we define the error message for each error
export const WalletRpcError = {
  [WalletRpcErrorCode.InvalidErc20]: 'An error occurred (NOT_ERC20)',
  [WalletRpcErrorCode.InvalidNetwork]: 'An error occurred (UNLISTED_NETWORK)',
  [WalletRpcErrorCode.UserDeny]: 'An error occurred (USER_REFUSED_OP)',
  [WalletRpcErrorCode.InvalidRequest]: 'An error occurred (NOT_ERC20)',
  [WalletRpcErrorCode.AccountAlreadyDeployed]: 'An error occurred (ACCOUNT_ALREADY_DEPLOYED)',
  [WalletRpcErrorCode.ApiVersionNotSupported]: 'An error occurred (API_VERSION_NOT_SUPPORTED)',
  [WalletRpcErrorCode.Unknown]: 'An error occurred (UNKNOWN_ERROR)',
};
export const defaultErrorCode = WalletRpcErrorCode.Unknown;
export const defaultErrorMessage = WalletRpcError[defaultErrorCode];

export class CustomError extends Error {
  readonly code: number;

  constructor(message: string, errorCode: number) {
    super(message);
    this.code = errorCode;
  }
}

/**
 * Create Custom Error base on the given error code to map with the Wallet API error.
 *
 * @param [errorCode] - Error code to map with the Wallet API error.
 * @returns A CustomError Object that contains the corresponing Wallet API Error code and message.
 */
export function createStarkError(errorCode?: number) {
  let code = errorCode ?? defaultErrorCode;
  let message = defaultErrorMessage;

  if (WalletRpcError[code]) {
    message = WalletRpcError[code];
  } else {
    code = defaultErrorCode;
  }

  return new CustomError(message, code);
}
