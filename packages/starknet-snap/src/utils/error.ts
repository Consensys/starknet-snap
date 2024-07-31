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

export class CustomError extends Error {
  name!: string;

  constructor(message: string) {
    super(message);

    // set error name as constructor name, make it not enumerable to keep native Error behavior
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target#new.target_in_constructors
    // see https://github.com/adriengibrat/ts-custom-error/issues/30
    Object.defineProperty(this, 'name', {
      value: new.target.name,
      enumerable: false,
      configurable: true,
    });

    // fix the extended error prototype chain
    // because typescript __extends implementation can't
    // see https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, new.target.prototype);
    // remove constructor from stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Compacts an error to a specific error instance.
 *
 * @param error - The error instance to be compacted.
 * @param ErrCtor - The error constructor for the desired error instance.
 * @returns The compacted error instance.
 */
export function compactError<ErrorInstance extends Error>(
  error: ErrorInstance,
  ErrCtor: new (message?: string) => ErrorInstance,
): ErrorInstance {
  if (error instanceof ErrCtor) {
    return error;
  }
  return new ErrCtor(error.message);
}

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
    MethodNotFoundError,
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
