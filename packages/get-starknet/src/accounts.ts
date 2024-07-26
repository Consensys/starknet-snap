import type {
  Abi,
  AllowArray,
  CairoVersion,
  Call,
  DeclareContractPayload,
  DeclareContractResponse,
  InvocationsDetails,
  InvokeFunctionResponse,
  ProviderInterface,
  ProviderOptions,
  Signature,
  SignerInterface,
  TypedData,
  UniversalDetails,
} from 'starknet';
import { Account } from 'starknet';

import type { MetaMaskSnap } from './snap';

export class MetaMaskAccount extends Account {
  #snap: MetaMaskSnap;

  #address: string;

  constructor(
    snap: MetaMaskSnap,
    providerOrOptions: ProviderOptions | ProviderInterface,
    address: string,
    pkOrSigner: Uint8Array | string | SignerInterface,
    cairoVersion?: CairoVersion,
  ) {
    super(providerOrOptions, address, pkOrSigner, cairoVersion);
    this.#snap = snap;
    this.#address = address;
  }

  async execute(
    calls: AllowArray<Call>,
    abisOrTransactionsDetail?: Abi[] | UniversalDetails,
    transactionsDetail?: UniversalDetails,
  ): Promise<InvokeFunctionResponse> {
    if (!transactionsDetail) {
      return this.#snap.execute(this.#address, calls, undefined, abisOrTransactionsDetail as UniversalDetails);
    }
    return this.#snap.execute(this.#address, calls, abisOrTransactionsDetail as Abi[], transactionsDetail);
  }

  async signMessage(typedData: TypedData): Promise<Signature> {
    return this.#snap.signMessage(typedData, true, this.#address);
  }

  async declare(
    contractPayload: DeclareContractPayload,
    transactionsDetails?: InvocationsDetails,
  ): Promise<DeclareContractResponse> {
    return this.#snap.declare(this.#address, contractPayload, transactionsDetails);
  }
}
