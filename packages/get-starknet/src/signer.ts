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

  /**
   * Signs a transaction calling the Snap.
   *
   * @param transactions - The array of transactions to be signed.
   * @param transactionsDetail - The details required for signing the transactions.
   * @param _abis - [Deprecated] The ABI definitions for the contracts involved in the transactions. This parameter is optional and may be undefined.
   * @returns A promise that resolves to the transaction signature.
   */
  async signTransaction(
    transactions: Call[],
    transactionsDetail: InvocationsSignerDetails,
    _abis?: Abi[] | undefined,
  ): Promise<Signature> {
    const result = (await this.#snap.signTransaction(
      this.#address,
      transactions,
      transactionsDetail,
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
