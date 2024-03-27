import { Mutex } from 'async-mutex';
import { AccContract } from './type';

export class MetaMaskSnapWalletState {
  private lock: Mutex;
  private _account: AccContract;

  constructor() {
    this.lock = new Mutex();
  }

  get account() {
    return this._account;
  }

  async setAccount(account: AccContract) {
    await this.lock.runExclusive(() => {
      this._account = account;
    });
  }
}
