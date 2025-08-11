import type { Calldata } from 'starknet';
import { CallData } from 'starknet';

import { ACCOUNT_CLASS_HASH } from '../../utils/constants';
import { CairoAccountContract } from './contract';

export class Cairo1Contract extends CairoAccountContract {
  cairoVerion = 1;

  classhash: string = ACCOUNT_CLASS_HASH;

  getCallData(): Calldata {
    return CallData.compile({
      signer: this.publicKey,
      guardian: '0',
    });
  }
}
