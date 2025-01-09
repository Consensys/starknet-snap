import { ec, num as numUtils } from 'starknet';

import { grindKey } from '../../utils/keyPair';

export class AccountKeyPair {
  #privateKey: string;

  #publicKey: string;

  constructor(key: string) {
    const accountKey = grindKey(key);
    this.#publicKey = ec.starkCurve.getStarkKey(accountKey);
    this.#privateKey = numUtils.toHex(accountKey);
  }

  get privateKey(): string {
    return this.#privateKey;
  }

  get publicKey(): string {
    return this.#publicKey;
  }
}
