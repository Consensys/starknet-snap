import { Mutex } from 'async-mutex';

import { SnapHelper } from './helpers';
import { Lock } from './lock';

export abstract class SnapStateManager<S> {
  private readonly lock: Mutex;
  constructor(createLock = false) {
    this.lock = Lock.Acquire(createLock);
  }

  protected async get(): Promise<S> {
    return SnapHelper.GetStateData<S>();
  }

  protected async set(state: S): Promise<void> {
    return SnapHelper.SetStateData<S>(state);
  }

  protected async update(update: (state: S) => Promise<void>): Promise<void> {
    return this.lock.runExclusive(async () => {
      const state = await this.get();
      await update(state);
      await this.set(state);
    });
  }
}
