import { CustomError } from '../exception';

export class TransactionServiceException extends CustomError {
  constructor(msg: string) {
    super(msg);
  }
}
