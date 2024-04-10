import { CustomError } from '../exception';

export class TransactionServiceError extends CustomError {
  constructor(msg: string) {
    super(msg);
  }
}
