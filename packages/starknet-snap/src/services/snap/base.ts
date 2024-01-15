import { SnapState } from '../../types/snapState';
import { Mutex } from 'async-mutex';

export class BaseSnapStateService {
  state: SnapState;
  lock: Mutex;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snap: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(snap: any, state?: SnapState) {
    this.state = state;
    this.snap = snap;
    this.lock = new Mutex();
  }

  async getState() {
    if (!this.state) {
      this.state = await this.snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'get',
        },
      });
    }
    return this.state;
  }

  async saveState(state: SnapState) {
    await this.snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: state,
      },
    });
  }
}
