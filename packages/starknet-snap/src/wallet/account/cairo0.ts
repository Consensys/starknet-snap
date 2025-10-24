import type { Calldata } from 'starknet';
import { CallData, hash } from 'starknet';

import {
  ACCOUNT_CLASS_HASH_LEGACY,
  PROXY_CONTRACT_HASH,
} from '../../utils/constants';
import { CairoAccountContract } from './contract';

export class Cairo0Contract extends CairoAccountContract {
  cairoVerion = 0;

  classhash: string = PROXY_CONTRACT_HASH;

  getCallData(): Calldata {
    return CallData.compile({
      implementation: ACCOUNT_CLASS_HASH_LEGACY,
      selector: hash.getSelectorFromName('initialize'),
      calldata: CallData.compile({ signer: this.publicKey, guardian: '0' }),
    });
  }
}
