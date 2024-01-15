import { num } from 'starknet';
import { BIP44AddressKeyDeriver } from '@metamask/key-tree';

import { grindKey } from '../../utils/keyPair';
import { Network, AccContract } from '../../types/snapState';
import { AccountContractService, type AccountContract } from '../accountContract';
import { AccountSnapStateService } from './snapState';

export class AccountKeyring {
  keyDeriver: BIP44AddressKeyDeriver;
  accountSnapStateService: AccountSnapStateService;
  accountContractService: AccountContractService;
  network: Network;
  perPage: number;
  curPage: number = 0;

  constructor(
    keyDeriver: BIP44AddressKeyDeriver,
    accountContractService: AccountContractService,
    accountSnapStateService: AccountSnapStateService,
    accountPerPage: number = 10,
  ) {
    this.keyDeriver = keyDeriver;
    this.accountContractService = accountContractService;
    this.accountSnapStateService = accountSnapStateService;
    this.network = this.accountContractService.provider.network;
    this.perPage = accountPerPage;
  }

  async getDeriverByIndex(index: number) {
    return await this.keyDeriver(index);
  }

  async getSeedByIndex(index: number): Promise<string> {
    const deriver = await this.getDeriverByIndex(index);
    return grindKey(deriver.privateKey);
  }

  async unlock(idx: number): Promise<AccountContract> {
    const seed = await this.getSeedByIndex(idx);
    return await this.accountContractService.getContract(seed);
  }

  async addAccounts(from: number, to: number): Promise<AccContract[]> {
    let accounts = [];
    for (let i = from; i < to; i++) {
      const account = await this.unlock(i);

      let chainPubKey = '';
      let upgradeRequired = false;

      if (await account.isDeployed()) {
        chainPubKey = await account.getChainPubKey();
        upgradeRequired = !(await this.accountContractService.isContractUpgraded(account));
      }

      const userAccount: AccContract = {
        addressSalt: account.pubKey,
        publicKey: chainPubKey,
        address: account.address,
        addressIndex: i,
        derivationPath: this.keyDeriver.path,
        deployTxnHash: '',
        chainId: this.network.chainId,
        upgradeRequired: upgradeRequired,
      };

      await this.accountSnapStateService.save(userAccount);
      accounts.push(userAccount);
    }

    return accounts;
  }

  async getAccounts(): Promise<AccContract[]> {
    return await this.accountSnapStateService.getAccounts(this.network.chainId);
  }

  async getFirstPage() {
    this.curPage = 0;
    return await this.#getPage(1);
  }

  async getNextPage() {
    return this.#getPage(1);
  }

  async getPreviousPage() {
    return this.#getPage(-1);
  }

  async #getPage(increment: number) {
    this.curPage += increment;

    if (this.curPage <= 0) {
      this.curPage = 1;
    }
    const from = (this.curPage - 1) * this.perPage;
    const to = from + this.perPage;

    return await this.addAccounts(from, to);
  }
  // TODO: move to accountContractController
  async getAccountContractByAddress(address: string, reflesh: boolean = false): Promise<AccountContract> {
    const acc = await this.accountSnapStateService.getAccount(address, this.network.chainId);
    let contract: AccountContract;
    if (acc) {
      contract = await this.#findAccountContractByIndex(address, acc.addressIndex);
    } else {
      contract = await this.#scanAccountContract(address, acc.addressIndex);
    }

    if (!contract) {
      throw new Error(`Account with address ${address} not found`);
    }

    if (await contract.isDeployed(reflesh)) {
      if (await this.accountContractService.isContractUpgraded(contract, reflesh)) {
        return this.accountContractService.toLatestContract(contract);
      }
    }
    return contract;
  }

  async #scanAccountContract(address: string, maxScan: number = 20): Promise<AccountContract | null> {
    for (let i = 0; i < maxScan; i++) {
      const contract = await this.#findAccountContractByIndex(address, i);
      if (contract != null) {
        return contract;
      }
    }
    return null;
  }

  async #findAccountContractByIndex(address: string, index: number): Promise<AccountContract | null> {
    // TODO hanled index is -1 or null
    const bigIntAddress = num.toBigInt(address);
    const seed = await this.getSeedByIndex(index);
    const contracts = await this.accountContractService.getContracts(seed);
    for (let j = 0; j < contracts.length; j++) {
      if (num.toBigInt(contracts[j].address) === bigIntAddress) {
        return contracts[j];
      }
    }
    return null;
  }
}
