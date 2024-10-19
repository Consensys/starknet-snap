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
    abisOrTransactionsDetail?: Abi[] | InvocationsDetails,
    details?: InvocationsDetails,
  ): Promise<InvokeFunctionResponse> {
    return this.#snap.execute({
      address: this.#address,
      calls,
      details: details ?? (abisOrTransactionsDetail as unknown as InvocationsDetails),
      abis: details ? (abisOrTransactionsDetail as Abi[]) : undefined,
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
