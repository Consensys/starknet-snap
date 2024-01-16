import { num } from 'starknet';
import { BIP44AddressKeyDeriver } from '@metamask/key-tree';

import { grindKey } from '../../utils/keyPair';
import { Network, AccContract } from '../../types/snapState';
import { AccountContractService, type AccountContract } from '../account-contract';
import { AccountSnapStateService } from './snapState';

export class AccountKeyring {
  keyDeriver: BIP44AddressKeyDeriver;
  accountSnapStateService: AccountSnapStateService;
  accountContractService: AccountContractService;
  network: Network;
  perPage: number;
  curPage = 0;

  constructor(
    keyDeriver: BIP44AddressKeyDeriver,
    accountContractService: AccountContractService,
    accountSnapStateService: AccountSnapStateService,
    accountPerPage = 10,
  ) {
    this.keyDeriver = keyDeriver;
    this.accountContractService = accountContractService;
    this.accountSnapStateService = accountSnapStateService;
    this.network = this.accountContractService.provider.network;
    this.perPage = accountPerPage;
  }

  async getSeedByIndex(index: number): Promise<string> {
    const deriver = await this.keyDeriver(index);
    return grindKey(deriver.privateKey);
  }

  async unlock(idx: number): Promise<AccountContract> {
    const seed = await this.getSeedByIndex(idx);
    return await this.accountContractService.getContract(seed);
  }

  async addAccounts(from: number, to: number): Promise<AccContract[]> {
    const idxs = Array.from({ length: to - from }, (_, i) => i + from);

    const accounts = await Promise.all(idxs.map(async (idx) => { 
      const account = await this.unlock(idx)
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
        addressIndex: idx,
        derivationPath: this.keyDeriver.path,
        deployTxnHash: '',
        chainId: this.network.chainId,
        upgradeRequired: upgradeRequired,
      };

      return userAccount
    })).then((result) => result.sort((a, b) => a.addressIndex - b.addressIndex))

    await this.accountSnapStateService.saveMany(accounts, this.network.chainId)
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

  // TODO: 
  // Add address+chainid to index mapping in snapState
  // Add index+chainid to contract mapping in snapState
  async getAccountContractByAddress(address: string, reflesh = false): Promise<AccountContract> {
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

  async #scanAccountContract(address: string, maxScan = 20): Promise<AccountContract | null> {
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
