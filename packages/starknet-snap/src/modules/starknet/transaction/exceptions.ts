import { CustomError } from '../../exception';

export class TransactionMgrError extends CustomError {
  constructor(msg: string) {
    super(msg);
  }
}

export class TransactionStateError extends CustomError {
  constructor(msg: string) {
    super(msg);
  }
}
