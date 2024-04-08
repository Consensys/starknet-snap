import { Mutex } from 'async-mutex';

const saveMutex = new Mutex();

export class Lock {
    static Acquire() {
        return saveMutex
    }
}