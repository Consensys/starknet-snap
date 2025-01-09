import type { Calldata } from 'starknet';
import { hash, addAddressPadding } from 'starknet';

import { ContractNotDeployedError } from '../../utils/exceptions';
import { isGTEMinVersion } from '../../utils/starknetUtils';
import type { AccountContractReader } from './reader';

export abstract class CairoAccountContract {
  protected _version: string;

  protected _balance: bigint;

  protected _address: string;

  publicKey: string;

  contractReader: AccountContractReader;

  /**
   * Contract method map of the Cairo contract.
   * This map is used to map the method name to the entrypoint of the contract.
   * The entrypoint may be different for each Cairo contract.
   */
  contractMethodMap: {
    getVersion: string;
  } = {
    getVersion: 'getVersion',
  };

  abstract classhash: string;

  abstract cairoVerion: number;

  constructor(publicKey: string, contractReader: AccountContractReader) {
    this.publicKey = publicKey;
    this.contractReader = contractReader;
  }

  /**
   * Gets the call data of the contract.
   * The call data is used to calculate the address of the contract.
   * The call data may be different for each Cairo contract.
   *
   * @returns call data of the contract.
   */
  protected abstract getCallData(): Calldata;

  get callData(): Calldata {
    return this.getCallData();
  }

  get deployPaylod(): {
    classHash: string;
    contractAddress: string;
    constructorCalldata: Calldata;
    addressSalt: string;
  } {
    return {
      classHash: this.classhash,
      contractAddress: this.address,
      constructorCalldata: this.callData,
      addressSalt: this.publicKey,
    };
  }

  get address(): string {
    if (this._address === undefined) {
      this._address = this.calculateAddress();
    }
    return this._address;
  }

  /**
   * Calculate the address of the contract base on the public key, class hash and callData of the contract.
   *
   * @returns The address of the contract.
   */
  protected calculateAddress(): string {
    const address = hash.calculateContractAddressFromHash(
      this.publicKey,
      this.classhash,
      this.callData,
      0,
    );
    return addAddressPadding(address);
  }

  /**
   * Gets the Cario version of the contract.
   *
   * @param [refresh] - Optional, if true the result will not be cached, otherwise it will be cached. Default false.
   * @returns A promise that resolve the version of the contract.
   */
  async getVersion(refresh = false): Promise<string> {
    // TODO: add cache layer
    if (refresh || this._version === undefined) {
      this._version = await this.contractReader.getVersion(this);
    }
    return this._version;
  }

  /**
   * Gets the ETH balance of the contract.
   *
   * @param [refresh] - Optional, if true the result will not be cached, otherwise it will be cached. Default false.
   * @returns A promise that resolve the ETH balance of the contract.
   */
  async getEthBalance(refresh = false): Promise<bigint> {
    // TODO: add cache layer
    if (refresh || this._balance === undefined) {
      this._balance = await this.contractReader.getEthBalance(this);
    }
    return this._balance;
  }

  /**
   * Determines whether the account contract is deployed.
   * if an `ContractNotDeployedError` is thrown, it means the contract is not deployed.
   *
   * @param [refresh] - Optional, if true the result will not be cached, otherwise it will be cached. Default false.
   * @returns A promise that resolve true if the contract is deployed, false otherwise.
   * @throws {ContractReadError} If an error occurs while reading the contract.
   */
  async isDeployed(refresh = false): Promise<boolean> {
    try {
      await this.getVersion(refresh);
      return true;
    } catch (error) {
      if (error instanceof ContractNotDeployedError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Determines whether the contract is upgraded.
   * if the contract is not deployed, it will throw an error.
   *
   * @param [refresh] - Optional, if true the result will not be cached, otherwise it will be cached. Default false.
   * @returns A promise that resolve true if the contract is upgraded, false otherwise.
   * @throws {ContractNotDeployedError} If the contract is not deployed.
   * @throws {ContractReadError} If an error occurs while reading the contract.
   */
  async isUpgraded(refresh = false): Promise<boolean> {
    const version = await this.getVersion(refresh);
    return isGTEMinVersion(version);
  }

  /**
   * Determines whether require upgrade is needed.
   * Returns true if the contract is upgraded, false otherwise.
   * If the contract is not deployed, returns false.
   *
   * @returns A promise that resolves true if the contract requires an upgrade, false otherwise.
   */
  async isRequireUpgrade(): Promise<boolean> {
    try {
      return !(await this.isUpgraded());
    } catch (error) {
      // If the contract is not deployed, a lastest Cairo Contract will be return,
      // hence no upgrade is needed.
      if (error instanceof ContractNotDeployedError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Determines whether require deploy is needed.
   * A contract requires a deploy if it is not deployed and has balance.
   *
   * @returns A promise that resolves true if the contract requires a deploy, false otherwise.
   */
  async isRequireDeploy(): Promise<boolean> {
    return (
      !(await this.isDeployed()) && (await this.getEthBalance()) > BigInt(0)
    );
  }

  /**
   * Creates a new account contract from an existing account contract.
   *
   * @param contract - The existing account contract to copy with.
   * @returns A promise that resolves the new account contract.
   */
  static fromAccountContract(
    this: new (...args: any[]) => CairoAccountContract,
    contract: CairoAccountContract,
  ): CairoAccountContract {
    const newContact = new this(contract.publicKey, contract.contractReader);

    // inherit the address from the original contract
    newContact.calculateAddress = newContact.calculateAddress.bind(contract);

    // Copy the metadata from the original contract to prevent duplicated call.
    newContact._balance = contract._balance;
    newContact._version = contract._version;

    return newContact;
  }
}
