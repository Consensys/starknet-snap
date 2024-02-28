import { CairoVersion, Calldata, hash, CallData, InvocationsDetails, InvokeFunctionResponse } from 'starknet';

import { NodeProvider } from '../../node';

import { AccountContractBase, AccountContractStatic } from './base';
import { ACCOUNT_CLASS_HASH_LEGACY, PROXY_CONTRACT_HASH, ACCOUNT_GUARDIAN } from '../../../utils/constants';
import { StaticImplements } from '../../../types/static';
import { padAddress } from '../../../utils/formatterUtils';
import { executeTxn } from '../../../utils/starknetUtils';

export class CairoZeroContract
  extends AccountContractBase
  implements StaticImplements<AccountContractStatic, typeof CairoZeroContract>
{
  static ClassHash: string = ACCOUNT_CLASS_HASH_LEGACY;
  static ProxyClassHash: string = PROXY_CONTRACT_HASH;
  static CairoVersion = '0' as CairoVersion;

  constructor(address: string, pubKey: string, prvKey: string, provider?: NodeProvider) {
    super(address, pubKey, prvKey, provider, CairoZeroContract.CairoVersion);
  }

  static GenerateAddressByPubKey(pubKey: string): string {
    const address = hash.calculateContractAddressFromHash(
      pubKey,
      CairoZeroContract.ProxyClassHash,
      CairoZeroContract.GetCallData(pubKey),
      0,
    );
    return padAddress(address);
  }

  static GetCallData(pubKey: string): Calldata {
    return CallData.compile({
      implementation: CairoZeroContract.ClassHash,
      selector: hash.getSelectorFromName('initialize'),
      calldata: CallData.compile({ signer: pubKey, guardian: ACCOUNT_GUARDIAN }),
    });
  }

  async getChainPubKey(): Promise<string> {
    const resp = await this.provider.callContract(this.address, 'getSigner');
    return resp.result[0];
  }

  async getVersion(): Promise<string> {
    const resp = await this.provider.callContract(this.address, 'getVersion');
    return resp.result[0];
  }

  async upgrade(
    invocationsDetails: InvocationsDetails,
    upgradedTo: AccountContractStatic,
  ): Promise<InvokeFunctionResponse> {
    const calldata = CallData.compile({
      implementation: upgradedTo.ClassHash,
      calldata: [0],
    });

    const txnInvocation = {
      contractAddress: this.address,
      entrypoint: 'upgrade',
      calldata,
    };

    return await executeTxn(
      this.provider.network,
      this.address,
      this.prvKey,
      txnInvocation,
      undefined,
      invocationsDetails,
      this.cairoVersion,
    );
  }
}
