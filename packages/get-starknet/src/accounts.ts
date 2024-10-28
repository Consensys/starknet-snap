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
import type { MetaMaskSnapWallet } from './wallet';

export class MetaMaskAccount extends Account {
  #wallet: MetaMaskSnapWallet;

  #snap: MetaMaskSnap;

  #address: string;

  constructor(
    wallet: MetaMaskSnapWallet,
    snap: MetaMaskSnap,
    providerOrOptions: ProviderOptions | ProviderInterface,
    address: string,
    pkOrSigner: Uint8Array | string | SignerInterface,
    cairoVersion?: CairoVersion,
  ) {
    super(providerOrOptions, address, pkOrSigner, cairoVersion);
    this.#wallet = wallet;
    this.#snap = snap;
    this.#address = address;
  }

  async syncWallet() {
    await this.#wallet.init(false);
    this.#address = this.#wallet.selectedAddress;
  }

  async execute(
    calls: AllowArray<Call>,
    // ABIs is deprecated and will be removed in the future
    abisOrTransactionsDetail?: Abi[] | InvocationsDetails,
    details?: InvocationsDetails,
  ): Promise<InvokeFunctionResponse> {
    await this.syncWallet();
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
    await this.syncWallet();
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
    await this.syncWallet();
    return this.#snap.declare({
      senderAddress: this.#address,
      contractPayload,
      invocationsDetails,
    });
  }
}
