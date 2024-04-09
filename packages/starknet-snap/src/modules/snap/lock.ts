import { Mutex } from 'async-mutex';

const saveMutex = new Mutex();

export class Lock {
  static Acquire(create = false) {
    if (create) {
      return new Mutex();
    }
    return saveMutex;
  }
}
