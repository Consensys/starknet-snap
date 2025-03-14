import type { CairoVersion } from 'starknet';

import type { AccContract, AccountMetaData } from '../../types/snapState';
import { getDefaultAccountName } from '../../utils/account';
import type { CairoAccountContract } from './contract';

export const DefaultAccountMetaData: AccountMetaData = {
  accountName: getDefaultAccountName(0),
};

/**
 * Account object that holds the private key, public key, address, chain id,
 * hd index, address salt and the `CairoAccountContract`.
 *
 * It can serialize itself to be persisted in the state.
 */
export class Account {
  privateKey: string;

  publicKey: string;

  address: string;

  chainId: string;

  hdIndex: number;

  addressSalt: string;

  /**
   * The Cairo version of the account contract.
   * `1` referred to Cairo 1.
   * `0` referred to Cairo 0.
   */
  cairoVersion: CairoVersion;

  accountContract: CairoAccountContract;

  metadata: AccountMetaData = Object.assign({}, DefaultAccountMetaData);

  constructor(props: {
    privateKey: string;
    publicKey: string;
    chainId: string;
    hdIndex: number;
    addressSalt: string;
    accountContract: CairoAccountContract;
    jsonData?: AccountMetaData;
  }) {
    this.privateKey = props.privateKey;
    this.publicKey = props.publicKey;
    this.chainId = props.chainId;
    this.hdIndex = props.hdIndex;
    this.addressSalt = props.addressSalt;
    this.address = props.accountContract.address;

    this.cairoVersion = props.accountContract.cairoVerion.toString(
      10,
    ) as CairoVersion;
    this.accountContract = props.accountContract;
    this.#jsonDataToMetaData(props.jsonData);
  }

  #jsonDataToMetaData(jsonData?: Partial<AccContract>): void {
    if (!jsonData) {
      this.metadata.accountName = getDefaultAccountName(this.hdIndex);
      return;
    }
    if (jsonData.accountName === undefined) {
      this.metadata.accountName = getDefaultAccountName(this.hdIndex);
    } else {
      this.metadata.accountName = jsonData.accountName;
    }
  }

  /**
   * Serialize the `Account` object.
   *
   * @returns A promise that resolves to the serialized `Account` object.
   */
  async serialize(): Promise<AccContract> {
    // When an Account object is discovered by the account service,
    // it should already cache the status of requireDeploy and requireUpgrade.
    const [upgradeRequired, deployRequired, isDeployed] = await Promise.all([
      this.accountContract.isRequireUpgrade(),
      this.accountContract.isRequireDeploy(),
      this.accountContract.isDeployed(),
    ]);
    return {
      addressSalt: this.publicKey,
      publicKey: this.publicKey,
      address: this.address,
      addressIndex: this.hdIndex,
      chainId: this.chainId,
      cairoVersion: this.cairoVersion,
      isDeployed,
      deployRequired,
      upgradeRequired,
      accountName: this.metadata.accountName,
    };
  }
}
