import {
  Provider,
  RawCalldata,
  CallContractResponse,
  ProviderOptions,
  validateAndParseAddress as _validateAndParseAddress,
} from 'starknet';

import { Network } from '../../types/snapState';

export interface NodeProvider {
  callContract(
    contractAddress: string,
    contractFuncName: string,
    contractCallData: RawCalldata,
  ): Promise<CallContractResponse>;
}

export class NodeProvider implements NodeProvider {
  network: Network;

  constructor(network: Network) {
    this.network = network;
  }

  getProvider(forceSequencer = false): Provider {
    let providerParam: ProviderOptions = {};
    // same precedence as defined in starknet.js Provider class constructor
    if (this.network.nodeUrl && !forceSequencer) {
      providerParam = {
        rpc: {
          nodeUrl: this.network.nodeUrl,
        },
      };
    } else if (this.network.baseUrl) {
      providerParam = {
        sequencer: {
          baseUrl: this.network.baseUrl,
        },
      };
    }
    return new Provider(providerParam);
  }

  async callContract(
    contractAddress: string,
    contractFuncName: string,
    contractCallData: RawCalldata = [],
  ): Promise<CallContractResponse> {
    return this.getProvider().callContract(
      {
        contractAddress,
        entrypoint: contractFuncName,
        calldata: contractCallData,
      },
      'latest',
    );
  }
}
