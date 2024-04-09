import { CustomError } from '../../exception';

export class TransactionMgrException extends CustomError {
  constructor(msg: string) {
    super(msg);
  }
}

export class TransactionStateException extends CustomError {
  constructor(msg: string) {
    super(msg);
  }
}
