export type SnapProvider = {
  registerRpcMessageHandler: (fn) => unknown;
  request(options: {
    method: string;
    params?: { [key: string]: unknown } | unknown[];
  }): unknown;
};

export class MockSnapProvider implements SnapProvider {
  public readonly registerRpcMessageHandler = jest.fn();

  public readonly requestStub = jest.fn();
  /* eslint-disable */
  public readonly rpcStubs = {
    snap_getBip32Entropy: jest.fn(),
    snap_getBip44Entropy: jest.fn(),
    snap_dialog: jest.fn(),
    snap_manageState: jest.fn(),
  };
  /* eslint-disable */

  /**
   * Calls this.requestStub or this.rpcStubs[req.method], if the method has
   * a dedicated stub.
   * @param args
   * @param args.method
   * @param args.params
   */
  public request(args: {
    method: string;
    params: { [key: string]: unknown } | unknown[];
  }): unknown {
    const { method, params } = args;
    if (Object.hasOwnProperty.call(this.rpcStubs, method)) {
      if (Array.isArray(params)) {
        return this.rpcStubs[method](...params);
      }
      return this.rpcStubs[method](params);
    }
    return this.requestStub(args);
  }
}
