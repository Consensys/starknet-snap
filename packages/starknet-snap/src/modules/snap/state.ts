import { Mutex } from 'async-mutex';
import { SnapHelper } from './helpers';

export abstract class SnapStateManager<S> {
  constructor(protected lock?: Mutex) {
    if (!this.lock) {
      this.lock = new Mutex();
    }
  }

  async get(): Promise<S> {
    return SnapHelper.getStateData<S>();
  }

  async set(state: S): Promise<void> {
    return SnapHelper.setStateData<S>(state);
  }

  async update(update: (state: S) => void): Promise<void> {
    return this.lock.runExclusive(async () => {
      const state = await this.get();
      update(state);
      await this.set(state);
    });
  }
}
