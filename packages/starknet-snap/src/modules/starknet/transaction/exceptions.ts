export class TransactionServiceException extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, TransactionServiceException.prototype);
  }
}
