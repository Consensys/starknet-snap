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
      return await this.rpcProvider.callContract(
        {
          contractAddress,
          entrypoint,
          calldata,
        },
        blockIdentifier,
      );
    } catch (error) {
      if (!error.message.includes(CONTRACT_NOT_DEPLOYED_ERROR)) {
        throw new ContractReadError(error.message);
      }
      throw new ContractNotDeployedError();
    }
  }
}
