import type { Network } from '../../types/snapState';
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

  constructor(network: Network) {
    this.network = network;
  }

  /**
   * Get the contract for the given public key.
   * The contract is determined based on the following rules:
   * 1. If a contract is deployed, then use the deployed contract.
   * 2. If no contract is deployed, but has balance, then use the contract with balance.
   * 3. If neither contract is deployed or has balance, then use the default contract.
   * 4. If multiple contracts are deployed, then use the default contract.
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
        } else if (
          contract instanceof Cairo0Contract &&
          (await contract.isRequireDeploy())
        ) {
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
