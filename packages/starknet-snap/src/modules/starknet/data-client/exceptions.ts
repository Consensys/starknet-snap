import { CustomError } from '../../exception';

export class DataClientError extends CustomError {
  constructor(msg: string) {
    super(msg);
  }
}
