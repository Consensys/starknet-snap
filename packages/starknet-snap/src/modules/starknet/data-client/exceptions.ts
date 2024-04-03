export class DataClientError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, DataClientError.prototype);
  }
}
