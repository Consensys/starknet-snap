import { Mutex } from 'async-mutex';

const saveMutex = new Mutex();

/**
 * Acquires or retrieves a lock.
 *
 * @param create - Whether to create a new lock or retrieve an existing one.
 * @returns A Mutex object representing the lock.
 */
export function acquireLock(create = false) {
  if (create) {
    return new Mutex();
  }
  return saveMutex;
}
