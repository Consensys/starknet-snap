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
    const contracts: CairoAccountContract[] = [];

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
            contracts.push(DefaultContractCtor.fromAccountContract(contract));
          } else {
            contracts.push(contract);
          }
        } else if (contract instanceof(Cairo0Contract) && await contract.isRequireDeploy()) {
          // It should only valid for Cairo 0 contract.
          // A Cairo 0 contract can only paying fee with ETH token.
          // Therefore if the contract is not deployed, and it has ETH token, we should use this contract.
          // And the UI will force the user to deploy the Cairo 0 contract.
          contracts.push(contract);
        }
      }),
    );

    // In case of multiple contracts are deployed or have balance,
    // We will not be able to determine which contract to use.
    // Hence, throw an error.
    if (contracts.length > 1) {
      throw new AccountDiscoveryError();
    } else if (contracts.length === 1) {
      cairoContract = contracts[0];
    }

    // Fallback with default contract.
    return cairoContract ?? new DefaultContractCtor(publicKey, reader);
  }
}
