import { BIP44CoinTypeNode } from '@metamask/key-tree';
import { generateMnemonic } from 'bip39';
import { generateBip44Entropy } from '../src/__tests__/helper';

export type SnapProvider = {
  registerRpcMessageHandler: (fn) => unknown;
  request(options: {
    method: string;
    params?: { [key: string]: unknown } | unknown[];
  }): unknown;
};

export const manageStateSpy = jest.fn();

export const dialogSpy = jest.fn();

export const requestSpy = jest.fn();

export class MockSnapProvider implements SnapProvider {
  public readonly registerRpcMessageHandler = jest.fn();

  /* eslint-disable */

  async getBip44Entropy() {
    return await generateBip44Entropy(generateMnemonic());
  }

  public readonly rpcSpys = {
    snap_getBip32Entropy: jest.fn(),
    snap_getBip44Entropy: this.getBip44Entropy,
    snap_dialog: dialogSpy,
    snap_manageState: manageStateSpy,
  };
  /* eslint-disable */

  /**
   * Calls requestSpy or this.rpcSpys[req.method], if the method has
   * a dedicated spy.
   * @param args
   * @param args.method
   * @param args.params
   */
  public request(args: {
    method: string;
    params: { [key: string]: unknown } | unknown[];
  }): unknown {
    const { method, params } = args;
    if (Object.hasOwnProperty.call(this.rpcSpys, method)) {
      if (Array.isArray(params)) {
        return this.rpcSpys[method](...params);
      }
      return this.rpcSpys[method](params);
    }
    return requestSpy(args);
  }
}
