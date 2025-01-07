import type { Network } from '../../types/snapState';
import { AccountDiscoveryError } from '../../utils/exceptions';
import { Cairo0Contract } from './cairo0';
import { Cairo1Contract } from './cairo1';
import type { CairoAccountContract } from './contract';
import { AccountContractReader } from './reader';
import type { CairoAccountContractStatic, ICairoAccountContract } from './type';

export class AccountContractDiscovery {
  protected defaultContractCtor: CairoAccountContractStatic = Cairo1Contract;

  protected contractCtors: ICairoAccountContract[] = [
    Cairo1Contract,
    Cairo0Contract,
  ];

  protected network: Network;

  protected ethBalanceThreshold = BigInt(0);

  constructor(network: Network) {
    this.network = network;
  }

  /**
   * Get the contract for the given public key.
   * The contract is determined based on the following rules:
   * 1. If a contract is deployed, then use the deployed contract.
   * 2. If no contract is deployed, but has balance, then use the contract with balance.
   * 3. If neither contract is deployed or has balance, then use the default contract.
   *
   * @param publicKey - The public key to get the contract for.
   * @returns The contract for the given public key.
   * @throws {AccountDiscoveryError} If multiple contracts are deployed or have balance.
   */
  async getContract(publicKey: string): Promise<CairoAccountContract> {
    const reader = new AccountContractReader(this.network);
    const DefaultContractCtor = this.defaultContractCtor;

    // Use array to store the result to prevent race condition.
    const contracts: {
      balance: CairoAccountContract[];
      deploy: CairoAccountContract[];
    } = {
      balance: [],
      deploy: [],
    };

    let cairoContract: CairoAccountContract | undefined;

    // Identify where all available contracts have been deployed, upgraded,
    // and whether they have an ETH balance or not.
    await Promise.all(
      this.contractCtors.map(async (ContractCtor: ICairoAccountContract) => {
        const contract = new ContractCtor(publicKey, reader);

        if (await contract.isDeployed()) {
          // if contract upgraded, bind the latest contract with current contract interface,
          // to inherit the address from current contract.
          if (await contract.isUpgraded()) {
            contracts.deploy.push(
              DefaultContractCtor.fromAccountContract(contract),
            );
          } else {
            contracts.deploy.push(contract);
          }
        } else if (await contract.isRequireDeploy()) {
          // if contract is not deployed but has balance, then use the contract with balance.
          contracts.balance.push(contract);
        }
      }),
    );

    // In case of multiple contracts are deployed or have balance,
    // We will not be able to determine which contract to use.
    // Hence, throw an error.
    if (contracts.balance.length > 1 || contracts.deploy.length > 1) {
      throw new AccountDiscoveryError();
    }

    if (contracts.deploy.length !== 0) {
      // if there is a deployed contract, then choose the deployed contract.
      cairoContract = contracts.deploy[0];
    } else if (contracts.balance.length !== 0) {
      // otherwise, then choose the contract with balance.
      cairoContract = contracts.balance[0];
    }

    // Fallback with default contract.
    return cairoContract ?? new DefaultContractCtor(publicKey, reader);
  }
}
