import type {
  Abi,
  ArraySignatureType,
  Call,
  DeclareSignerDetails,
  DeployAccountSignerDetails,
  InvocationsSignerDetails,
  Signature,
  SignerInterface,
  TypedData,
} from 'starknet';
import { ec, num as numUtils } from 'starknet';

import type { MetaMaskSnap } from './snap';

export class MetaMaskSigner implements SignerInterface {
  #snap: MetaMaskSnap;

  #address: string;

  constructor(snap: MetaMaskSnap, address: string) {
    this.#snap = snap;
    this.#address = address;
  }

  async getPubKey(): Promise<string> {
    return this.#snap.getPubKey(this.#address);
  }

  async signMessage(typedData: TypedData, accountAddress: string): Promise<Signature> {
    const result = (await this.#snap.signMessage(typedData, false, accountAddress)) as ArraySignatureType;
    return new ec.starkCurve.Signature(numUtils.toBigInt(result[0]), numUtils.toBigInt(result[1]));
  }

  async signTransaction(
    transactions: Call[],
    transactionsDetail: InvocationsSignerDetails,
    abis?: Abi[] | undefined,
  ): Promise<Signature> {
    const result = (await this.#snap.signTransaction(
      this.#address,
      transactions,
      transactionsDetail,
      abis,
    )) as ArraySignatureType;
    return new ec.starkCurve.Signature(numUtils.toBigInt(result[0]), numUtils.toBigInt(result[1]));
  }

  async signDeployAccountTransaction(transaction: DeployAccountSignerDetails): Promise<Signature> {
    const result = (await this.#snap.signDeployAccountTransaction(this.#address, transaction)) as ArraySignatureType;
    return new ec.starkCurve.Signature(numUtils.toBigInt(result[0]), numUtils.toBigInt(result[1]));
  }

  async signDeclareTransaction(transaction: DeclareSignerDetails): Promise<Signature> {
    const result = (await this.#snap.signDeclareTransaction(this.#address, transaction)) as ArraySignatureType;
    return new ec.starkCurve.Signature(numUtils.toBigInt(result[0]), numUtils.toBigInt(result[1]));
  }
}
