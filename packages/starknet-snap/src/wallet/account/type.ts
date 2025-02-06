import type { CairoAccountContract } from './contract';
import type { AccountContractReader } from './reader';

export type ICairoAccountContract = new (
  publicKey: string,
  contractReader: AccountContractReader,
) => CairoAccountContract;

export type CairoAccountContractStatic = {
  fromAccountContract(
    accountContract: CairoAccountContract,
  ): CairoAccountContract;
} & ICairoAccountContract;
