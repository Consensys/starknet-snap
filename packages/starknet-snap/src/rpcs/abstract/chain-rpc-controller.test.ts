import { string } from 'superstruct';

import { mockNetworkStateManager } from '../../state/__tests__/helper';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../utils/constants';
import { InvalidNetworkError } from '../../utils/exceptions';
import { BaseRequestStruct } from '../../utils/superstruct';
import { ChainRpcController } from './chain-rpc-controller';

describe('ChainRpcController', () => {
  type Request = { chainId: string };
  class MockRpc extends ChainRpcController<Request, string> {
    protected requestStruct = BaseRequestStruct;

    protected responseStruct = string();

    // Set it to public to be able to spy on it
    async handleRequest(params: Request) {
      return `tested with ${params.chainId}`;
    }
  }

  it('executes request', async () => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const { getNetworkSpy } = mockNetworkStateManager(network);
    const { chainId } = network;

    const rpc = new MockRpc();
    const result = await rpc.execute({
      chainId,
    });

    expect(getNetworkSpy).toHaveBeenCalledWith({ chainId });
    expect(result).toBe(`tested with ${chainId}`);
  });

  it('throws `InvalidNetworkError` error if the given chainId not found.', async () => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    mockNetworkStateManager(null);
    const { chainId } = network;

    const rpc = new MockRpc();
    await expect(
      rpc.execute({
        chainId,
      }),
    ).rejects.toThrow(InvalidNetworkError);
  });
});
