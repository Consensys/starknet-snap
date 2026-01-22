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
    return this.#snap.getPubKey({
      userAddress: this.#address,
    });
  }

  /**
   * Signs a message using the Snap.
   * 
   * @deprecated The `enableAuthorize` parameter is deprecated for security reasons.
   * The Snap will now always require user confirmation for signing operations.
   * This method will continue to work but will show the confirmation dialog.
   * 
   * @param typedDataMessage - The typed data message to sign.
   * @param address - The address to sign with.
   * @returns A promise that resolves to the signature.
   */
  async signMessage(typedDataMessage: TypedData, address: string): Promise<Signature> {
    const result = (await this.#snap.signMessage({
      typedDataMessage,
      enableAuthorize: true, // Deprecated: will be ignored by snap, always shows UI
      address,
    })) as ArraySignatureType;
    return new ec.starkCurve.Signature(numUtils.toBigInt(result[0]), numUtils.toBigInt(result[1]));
  }

  /**
   * Signs a transaction calling the Snap.
   * 
   * @deprecated The `enableAuthorize` parameter is deprecated for security reasons.
   * The Snap will now always require user confirmation for signing operations.
   * This method will continue to work but will show the confirmation dialog.
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
    const result = (await this.#snap.signTransaction({
      address: this.#address,
      transactions,
      transactionsDetail,
      enableAuthorize: true, // Deprecated: will be ignored by snap, always shows UI
    })) as ArraySignatureType;
    return new ec.starkCurve.Signature(numUtils.toBigInt(result[0]), numUtils.toBigInt(result[1]));
  }

  async signDeployAccountTransaction(transaction: DeployAccountSignerDetails): Promise<Signature> {
    const result = (await this.#snap.signDeployAccountTransaction({
      signerAddress: this.#address,
      transaction,
    })) as ArraySignatureType;
    return new ec.starkCurve.Signature(numUtils.toBigInt(result[0]), numUtils.toBigInt(result[1]));
  }

  async signDeclareTransaction(transaction: DeclareSignerDetails): Promise<Signature> {
    const result = (await this.#snap.signDeclareTransaction({
      address: this.#address,
      details: transaction,
    })) as ArraySignatureType;
    return new ec.starkCurve.Signature(numUtils.toBigInt(result[0]), numUtils.toBigInt(result[1]));
  }
}
