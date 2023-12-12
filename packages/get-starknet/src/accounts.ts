import { MetaMaskSnap } from './snap';
import {
  Abi,
  Account,
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
    abis?: Abi[] | undefined,
    transactionsDetail?: InvocationsDetails,
  ): Promise<InvokeFunctionResponse> {
    return this.#snap.execute(this.#address, calls, abis, transactionsDetail);
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
