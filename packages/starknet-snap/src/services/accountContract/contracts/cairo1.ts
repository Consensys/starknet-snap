import { CairoVersion, Calldata, hash, CallData, InvocationsDetails, InvokeFunctionResponse } from 'starknet';

import { NodeProvider } from '../../node';

import { AccountContractBase, AccountContractStatic } from './base';
import { ACCOUNT_CLASS_HASH } from '../../../utils/constants';
import { StaticImplements } from '../../../types/static';
import { padAddress } from '../../../utils/formatterUtils';

export class CairoOneContract
  extends AccountContractBase
  implements StaticImplements<AccountContractStatic, typeof CairoOneContract>
{
  static ClassHash: string = ACCOUNT_CLASS_HASH;
  static CairoVersion = '1' as CairoVersion;

  constructor(address: string, pubKey: string, priKey: string, provider?: NodeProvider) {
    super(address, pubKey, priKey, provider, CairoOneContract.CairoVersion);
  }

  static GenerateAddressByPubKey(pubKey: string): string {
    const address = hash.calculateContractAddressFromHash(
      pubKey,
      CairoOneContract.ClassHash,
      CairoOneContract.GetCallData(pubKey),
      0,
    );
    return padAddress(address);
  }

  static GetCallData(pubKey: string): Calldata {
    return CallData.compile({
      signer: pubKey,
      guardian: '0',
    });
  }

  async getChainPubKey(): Promise<string> {
    const resp = await this.provider.callContract(this.address, 'get_owner');
    return resp.result[0];
  }

  async getVersion(): Promise<string> {
    const resp = await this.provider.callContract(this.address, 'getVersion');
    return resp.result[0];
  }

  async upgrade(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invocationsDetails: InvocationsDetails,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    upgradedTo: AccountContractStatic,
  ): Promise<InvokeFunctionResponse> {
    throw new Error('Not implemented');
  }
}
