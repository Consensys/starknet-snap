import type {
  BlockIdentifier,
  CallContractResponse,
  Provider,
  RawCalldata,
} from 'starknet';
import { BlockTag } from 'starknet';

import type { Network } from '../types/snapState';
import {
  ContractNotDeployedError,
  ContractReadError,
  CONTRACT_NOT_DEPLOYED_ERROR,
} from './exceptions';
import { getProvider } from './starknetUtils';

export class ContractReader {
  rpcProvider: Provider;

  constructor(network: Network) {
    this.rpcProvider = getProvider(network);
  }

  /**
   * Call a contract method.
   *
   * @param param - The parameters to pass to the contract.
   * @param param.contractAddress - The address of the contract to call.
   * @param param.entrypoint - The entrypoint of the contract to call.
   * @param param.calldata - The calldata to pass to the contract.
   * @param [param.blockIdentifier] - Optional, the block to call the contract at, default `lastest`.
   * @returns A promise that resolves to the response of the contract call.
   */
  async callContract({
    contractAddress,
    entrypoint,
    calldata = [],
    blockIdentifier = BlockTag.LATEST,
  }: {
    contractAddress: string;
    entrypoint: string;
    calldata?: RawCalldata;
    blockIdentifier?: BlockIdentifier;
  }): Promise<CallContractResponse> {
    try {
      const resp = await this.rpcProvider.callContract(
        {
          contractAddress,
          entrypoint,
          calldata,
        },
        blockIdentifier,
      );

      // starknet.js's `fetchEndpoint` resolves to `undefined` when the node
      // replies with a JSON body that contains neither `result` nor `error`
      // (it destructures `{ error, result }` and returns `result` unguarded).
      // Callers index into the response (e.g. `resp[0]` in
      // `AccountContractReader`), so an unguarded pass-through surfaces as
      // `TypeError: Cannot read properties of undefined (reading '0')`.
      if (!Array.isArray(resp) || resp.length === 0) {
        throw new ContractReadError(
          `Invalid RPC response calling ${entrypoint} on ${contractAddress}: ${JSON.stringify(
            resp,
          )}`,
        );
      }

      return resp;
    } catch (error) {
      if (error instanceof ContractReadError) {
        throw error;
      }
      // `error.message` is not guaranteed: non-Error values can be thrown.
      if (!error?.message?.includes?.(CONTRACT_NOT_DEPLOYED_ERROR)) {
        throw new ContractReadError(error?.message ?? String(error));
      }
      throw new ContractNotDeployedError();
    }
  }
}
