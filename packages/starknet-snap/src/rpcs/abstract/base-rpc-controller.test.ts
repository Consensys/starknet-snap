import { string } from 'superstruct';

import { RpcController } from './base-rpc-controller';

jest.mock('../../utils/logger');

describe('RpcController', () => {
  class MockRpc extends RpcController<string, string> {
    protected requestStruct = string();

    protected responseStruct = string();

    // Set it to public to be able to spy on it
    async handleRequest(params: string) {
      return `done ${params}`;
    }
  }

  it('executes request', async () => {
    const rpc = new MockRpc();

    const result = await rpc.execute('test');

    expect(result).toBe('done test');
  });
});
