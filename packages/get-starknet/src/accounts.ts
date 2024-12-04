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
    // ABIs is deprecated and will be removed in the future
    abisOrTransactionsDetail?: Abi[] | InvocationsDetails,
    details?: InvocationsDetails,
  ): Promise<InvokeFunctionResponse> {
    // if abisOrTransactionsDetail is an array, we assume it's an array of ABIs
    // otherwise, we assume it's an InvocationsDetails object
    if (Array.isArray(abisOrTransactionsDetail)) {
      return this.#snap.execute({
        address: this.#address,
        calls,
        details,
        abis: abisOrTransactionsDetail,
      });
    }
    return this.#snap.execute({
      address: this.#address,
      calls,
      details: abisOrTransactionsDetail as unknown as InvocationsDetails,
    });
  }

  async signMessage(typedDataMessage: TypedData): Promise<Signature> {
    return this.#snap.signMessage({
      typedDataMessage,
      address: this.#address,
      enableAuthorize: true,
    });
  }

  async declare(
    contractPayload: DeclareContractPayload,
    invocationsDetails?: InvocationsDetails,
  ): Promise<DeclareContractResponse> {
    return this.#snap.declare({
      senderAddress: this.#address,
      contractPayload,
      invocationsDetails,
    });
  }
}
