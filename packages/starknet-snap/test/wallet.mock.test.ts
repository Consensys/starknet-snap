import sinon from 'sinon';
export interface Wallet {
  registerRpcMessageHandler: (fn) => unknown;
  request(options: { method: string; params?: unknown[] }): unknown;
}

export class WalletMock implements Wallet {
  public readonly registerRpcMessageHandler = sinon.stub();

  public readonly requestStub = sinon.stub();

  public readonly rpcStubs = {
    snap_getBip44Entropy_9004: sinon.stub(),
    snap_confirm: sinon.stub(),
    snap_manageState: sinon.stub(),
  };

  /**
   * Calls this.requestStub or this.rpcStubs[req.method], if the method has
   * a dedicated stub.
   */
  public request(args: { method: string; params: unknown[] }): unknown {
    const { method, params = [] } = args;
    if (Object.hasOwnProperty.call(this.rpcStubs, method)) {
      return this.rpcStubs[method](...params);
    }
    return this.requestStub(args);
  }

  public reset(): void {
    this.registerRpcMessageHandler.reset();
    this.requestStub.reset();
    Object.values(this.rpcStubs).forEach((stub: ReturnType<typeof sinon.stub>) => stub.reset());
  }
}
