import { CairoVersion, Calldata, ec, num, InvocationsDetails, InvokeFunctionResponse } from 'starknet';

import { NodeProvider } from '../../node/provider';
import { CAIRO_VERSION } from '../../../utils/constants';

import { padAddress, hexToString } from '../../../utils/formatterUtils';

export interface AccountContract {
  address: string;
  pubKey: string;
  prvKey: string;
  deployed?: boolean;
  upgraded?: boolean;
  provider: NodeProvider;
  cairoVersion: CairoVersion;

  isDeployed(reflesh?: boolean): Promise<boolean>;
  isUpgraded(minVersion, reflesh?: boolean): Promise<boolean>;
  getChainPubKey(): Promise<string>;
  getVersion(): Promise<string>;
  upgrade(invocationsDetails: InvocationsDetails, upgradedTo: AccountContractStatic): Promise<InvokeFunctionResponse>;
}

export interface AccountContractStatic {
  CairoVersion: CairoVersion;
  ClassHash: string;
  new (address: string, pubKey: string, prvKey: string, provider?: NodeProvider): AccountContract;
  FromSeed(seed: string, provider?: NodeProvider): AccountContract;
  FromAccountContract(accountContract: AccountContract): AccountContract;
  GetCallData(pubKey: string): Calldata;
  GenerateAddressByPubKey(pubKey: string): string;
}

export abstract class AccountContractBase {
  address: string;
  pubKey: string;
  prvKey: string;
  deployed?: boolean;
  upgraded?: boolean;
  provider: NodeProvider;
  cairoVersion: CairoVersion;

  constructor(
    address: string,
    pubKey: string,
    prvKey: string,
    provider?: NodeProvider,
    cairoVersion: CairoVersion = CAIRO_VERSION,
  ) {
    this.address = address;
    this.provider = provider;
    this.pubKey = pubKey;
    this.prvKey = prvKey;
    this.cairoVersion = cairoVersion;
  }

  async getVersion(): Promise<string> {
    throw new Error('Not implemented');
  }

  async isDeployed(reflesh: boolean = false): Promise<boolean> {
    if (reflesh || this.deployed === undefined) {
      try {
        await this.getVersion();
        this.deployed = true;
      } catch (err) {
        if (!err.message.includes('Contract not found')) {
          throw err;
        }
        this.deployed = false;
      }
    }
    return this.deployed;
  }

  async isUpgraded(minVersion, reflesh: boolean = false): Promise<boolean> {
    if (reflesh || this.upgraded === undefined) {
      const hexResp = await this.getVersion();
      const versionArr = hexToString(hexResp).split('.');
      this.upgraded = Number(versionArr[1]) >= minVersion;
    }
    return this.upgraded;
  }

  static FromAccountContract(
    this: new (...args: any[]) => AccountContract,
    accountContract: AccountContract,
  ): AccountContract {
    const instance = new this(
      accountContract.address,
      accountContract.pubKey,
      accountContract.prvKey,
      accountContract.provider,
      accountContract.cairoVersion,
    );
    instance.deployed = accountContract.deployed;
    instance.upgraded = accountContract.upgraded;
    return instance;
  }

  static FromSeed(this: AccountContractStatic, seed: string, provider?: NodeProvider): AccountContract {
    const pubKey = ec.starkCurve.getStarkKey(seed);
    const prvKey = num.toHex(seed);
    const address = this.GenerateAddressByPubKey(pubKey);
    return new this(padAddress(address), pubKey, prvKey, provider);
  }
}
