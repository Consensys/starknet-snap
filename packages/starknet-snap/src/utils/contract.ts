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
import { logger } from './logger';
import { getProvider } from './starknetUtils';

export class ContractReader {
  rpcProvider: Provider;

  /**
   * How many times to attempt a contract call whose response arrives with an
   * invalid shape, and the base delay between attempts. See `callContract`.
   */
  static readonly maxCallAttempts = 3;

  static readonly retryDelayMs = 100;

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
    // starknet.js's `fetchEndpoint` resolves to `undefined` when a response
    // body contains neither `result` nor `error` (it destructures
    // `{ error, result }` and returns `result` unguarded). Callers index into
    // the response (e.g. `resp[0]` in `AccountContractReader`), so an
    // unguarded pass-through surfaces as
    // `TypeError: Cannot read properties of undefined (reading '0')`.
    //
    // Inside the Snap this happens intermittently: `fetch` is not native, it
    // is proxied across the sandbox boundary by the `endowment:network-access`
    // permission, and account discovery fires several concurrent calls
    // through it. The same requests replayed outside the sandbox return
    // well-formed bodies (verified directly against the RPC node), so the
    // invalid shape is transient - retry before giving up.
    let resp: CallContractResponse | undefined;

    for (
      let attempt = 1;
      attempt <= ContractReader.maxCallAttempts;
      attempt++
    ) {
      try {
        resp = await this.rpcProvider.callContract(
          {
            contractAddress,
            entrypoint,
            calldata,
          },
          blockIdentifier,
        );
      } catch (error) {
        // Real RPC errors are not retried: `Contract not found` is an
        // expected signal (undeployed account), anything else is a genuine
        // failure the caller needs to see.
        // `error.message` is not guaranteed: non-Error values can be thrown.
        if (!error?.message?.includes?.(CONTRACT_NOT_DEPLOYED_ERROR)) {
          throw new ContractReadError(error?.message ?? String(error));
        }
        throw new ContractNotDeployedError();
      }

      if (Array.isArray(resp) && resp.length > 0) {
        return resp;
      }

      logger.warn(
        `ContractReader.callContract: invalid response calling ${entrypoint} on ${contractAddress} (attempt ${attempt}/${
          ContractReader.maxCallAttempts
        }): ${JSON.stringify(resp)}`,
      );

      if (attempt < ContractReader.maxCallAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, ContractReader.retryDelayMs * attempt),
        );
      }
    }

    throw new ContractReadError(
      `Invalid RPC response calling ${entrypoint} on ${contractAddress} after ${
        ContractReader.maxCallAttempts
      } attempts: ${JSON.stringify(resp)}`,
    );
  }
}
