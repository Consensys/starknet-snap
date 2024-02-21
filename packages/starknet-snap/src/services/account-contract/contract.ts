import type { AccountContract, AccountContractStatic } from './contracts';
import { NodeProvider } from '../node';

export class AccountContractService {
  #accountContracts: Array<AccountContractStatic> = [];
  accountContract: AccountContract;
  provider: NodeProvider;

  constructor(accountContracts: Array<AccountContractStatic>, provider: NodeProvider) {
    this.#accountContracts = accountContracts;
    this.provider = provider;
  }

  async getContract(seed: string): Promise<AccountContract> {
    let accountContract: AccountContract;
    let defaultContract: AccountContract;

    for (let i = 0; i < this.#accountContracts.length; i++) {
      const account = this.#accountContracts[i];

      const _accountContract = account.FromSeed(seed, this.provider);

      if (i === 0) {
        defaultContract = _accountContract;
      }

      if (!(await _accountContract.isDeployed())) {
        continue;
      }

      if (await this.isContractUpgraded(_accountContract)) {
        // if contract upgraded, use the latest contract interface
        accountContract = this.#accountContracts[0].FromAccountContract(_accountContract);
        break;
      } else {
        // if contract not upgraded but deployed, use the legacy contract interface
        accountContract = _accountContract;
      }
    }
    // always use default latest contract interface if no contract deployed
    return accountContract ?? defaultContract;
  }

  async getContracts(seed: string): Promise<Array<AccountContract>> {
    const accountContracts: Array<AccountContract> = [];
    for (let i = 0; i < this.#accountContracts.length; i++) {
      const account = this.#accountContracts[i];
      const accountContract = account.FromSeed(seed, this.provider);
      accountContracts.push(accountContract);
    }
    return accountContracts;
  }

  async isContractUpgraded(contract: AccountContract, refresh = false): Promise<boolean> {
    return await contract.isUpgraded(3, refresh);
  }

  toLatestContract(contract: AccountContract): AccountContract {
    return this.#accountContracts[0].FromAccountContract(contract);
  }
}
