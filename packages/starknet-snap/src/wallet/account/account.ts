import type { CairoVersion } from 'starknet';

import type { AccContract } from '../../types/snapState';
import type { CairoAccountContract } from './contract';

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

  constructor(props: {
    privateKey: string;
    publicKey: string;
    chainId: string;
    hdIndex: number;
    addressSalt: string;
    accountContract: CairoAccountContract;
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
  }

  /**
   * Serialize the `Account` object.
   *
   * @returns A promise that resolves to the serialized `Account` object.
   */
  async serialize(): Promise<AccContract> {
    // When a Account object discovery by the account service,
    // it should already cached the status of requireDeploy and requireUpgrade.
    const [upgradeRequired, deployRequired] = await Promise.all([
      this.accountContract.isRequireUpgrade(),
      this.accountContract.isRequireDeploy(),
    ]);
    return {
      addressSalt: this.publicKey,
      publicKey: this.publicKey,
      address: this.address,
      addressIndex: this.hdIndex,
      chainId: this.chainId,
      cairoVersion: this.cairoVersion,
      upgradeRequired,
      deployRequired,
    };
  }
}
