import type { Network } from '../../types/snapState';
import { AccountDiscoveryType } from '../../utils/factory';
import { Cairo0Contract } from './cairo0';
import { Cairo1Contract } from './cairo1';
import type { CairoAccountContract } from './contract';
import { AccountContractReader } from './reader';
import type { CairoAccountContractStatic, ICairoAccountContract } from './type';

export class AccountContractDiscovery {
  protected defaultContractCtor: CairoAccountContractStatic = Cairo1Contract;

  // The order of the `contractCtors` array determines the priority of the contract to be selected.
  protected contractCtors: ICairoAccountContract[] = [
    Cairo1Contract,
    Cairo0Contract,
  ];

  protected network: Network;

  constructor(network: Network, discoveryType?: AccountDiscoveryType) {
    this.network = network;
    if (discoveryType !== undefined) {
      switch (discoveryType) {
        case AccountDiscoveryType.ForceCairo1:
          this.contractCtors = [Cairo1Contract];
          this.defaultContractCtor = Cairo1Contract;
          break;
        // We default te Cairo0 discovery
        default:
          this.contractCtors = [Cairo0Contract];
          this.defaultContractCtor = Cairo0Contract;
          break;
      }
    }
  }

  /**
   * Get the contract for the given public key.
   * The contract is determined based on the following rules:
   *
   * 1. If a Cairo 1 contract has been deployed, it will always be used regardless of whether the other contract has a balance in ETH or has been deployed.
   * 2. If a Cairo 0 contract has been deployed and the other contract has not, the Cairo 0 contract will always be used regardless of whether the other contract has a balance or not, and the contract will be forced to upgrade.
   * 3. If neither contract has been deployed, but a Cairo 0 contract has a balance in ETH, it will always be used regardless of whether the other contract has a balance or not, and the contract will be forced to deploy.
   * 3. If neither contract has been deployed and neither has a balance in ETH, the default contract (Cairo 1) will be used."
   *
   * Note: The rules accommodate for most use cases, except 1 edge case:
   * - Due to rule #1, if a user wont able to operated a Cairo 0 contract if a Cairo 1 contract has been deployed.
   *
   * @param publicKey - The public key to get the contract for.
   * @returns The contract for the given public key.
   * @throws {AccountDiscoveryError} If multiple contracts are deployed or have balance.
   */
  async getContract(publicKey: string): Promise<CairoAccountContract> {
    const reader = new AccountContractReader(this.network);
    const DefaultContractCtor = this.defaultContractCtor;

    // Identify where all available contracts have been deployed, upgraded,
    // and whether they have an ETH balance or not.
    const contracts = await Promise.all(
      this.contractCtors.map(async (ContractCtor: ICairoAccountContract) => {
        const contract = new ContractCtor(publicKey, reader);

        if (await contract.isDeployed()) {
          // if contract upgraded, bind the latest contract with current contract interface,
          // to inherit the address from current contract.
          if (await contract.isUpgraded()) {
            return DefaultContractCtor.fromAccountContract(contract);
          }
          return contract;
        } else if (await contract.isRequireDeploy()) {
          // It should only valid for Cairo 0 contract.
          // A Cairo 0 contract can only paying fee with ETH token.
          // Therefore if the contract is not deployed, and it has ETH token, we should use this contract.
          // And the UI will force the user to deploy the Cairo 0 contract.
          return contract;
        }

        return null;
      }),
    );

    // If multiple contracts are deployed, the first contract in the `contractCtors` array will be selected.
    for (const contract of contracts) {
      if (contract !== null) {
        return contract;
      }
    }

    // Fallback with default contract.
    return new DefaultContractCtor(publicKey, reader);
  }
}
