import { num, constants } from 'starknet';

import { BaseSnapStateService } from '../snap';
import { Network, AccContract } from '../../types/snapState';

export class AccountSnapStateService extends BaseSnapStateService {
  network: Network;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(snap: any, network: Network) {
    super(snap);
    this.network = network;
  }

  async getAccount(address: string, chainId: string) {
    const bigIntAccountAddress = num.toBigInt(address);
    const state = await this.getState();
    return state.accContracts?.find(
      (acc) => num.toBigInt(acc.address) === bigIntAccountAddress && this.#isSameChainId(acc.chainId, chainId),
    );
  }

  async getAccounts(chainId: string) {
    const state = await this.getState();
    return state.accContracts
      .filter((acc) => this.#isSameChainId(acc.chainId, chainId))
      .sort((a: AccContract, b: AccContract) => a.addressIndex - b.addressIndex);
  }

  async getUninitializedAccount(path: string, chainId: string) {
    const accounts = (await this.getAccounts(chainId)).filter(
      (acc) => acc.derivationPath === path && acc.addressIndex >= 0,
    );
    const firstUninitAccount = accounts.find((acc) => !acc.publicKey || num.toBigInt(acc.publicKey) === constants.ZERO);
    return firstUninitAccount ?? accounts;
  }

  async save(userAccount: AccContract): Promise<void> {
    return this.lock.runExclusive(async () => {
      const storedAccount = await this.getAccount(userAccount.address, userAccount.chainId);

      const state = await this.getState();

      if (!storedAccount) {
        if (!state.accContracts) {
          state.accContracts = [];
        }
        state.accContracts.push(userAccount);
      } else {
        storedAccount.addressSalt = userAccount.addressSalt;
        storedAccount.addressIndex = userAccount.addressIndex;
        storedAccount.derivationPath = userAccount.derivationPath;
        storedAccount.publicKey = userAccount.publicKey;
        storedAccount.deployTxnHash = userAccount.deployTxnHash || storedAccount.deployTxnHash;
        storedAccount.upgradeRequired = userAccount.upgradeRequired;
      }

      await this.saveState(state);
    })
  }

  async saveMany(userAccounts: Array<AccContract>, chainId:string): Promise<void> {
    return this.lock.runExclusive(async () => {
      const state = await this.getState();
      const accounts = await this.getAccounts(chainId);
      const accountMap = new Map(accounts.map((acc) => [acc.address, acc]));
      if (!state.accContracts) {
        state.accContracts = [];
      }

      for (let i = 0; i< userAccounts.length; i++) {
        const userAccount = userAccounts[i];
        const storedAccount = accountMap.get(userAccount.address)
        if (!storedAccount) {
          state.accContracts.push(userAccount);
          accountMap.set(userAccount.address, userAccount);
        } else {
          storedAccount.addressSalt = userAccount.addressSalt;
          storedAccount.addressIndex = userAccount.addressIndex;
          storedAccount.derivationPath = userAccount.derivationPath;
          storedAccount.publicKey = userAccount.publicKey;
          storedAccount.deployTxnHash = userAccount.deployTxnHash || storedAccount.deployTxnHash;
          storedAccount.upgradeRequired = userAccount.upgradeRequired;
        }
      }
    })
  }

  #isSameChainId(chainId1: string, chainId2: string) {
    return num.toBigInt(chainId1) === num.toBigInt(chainId2);
  }
}
