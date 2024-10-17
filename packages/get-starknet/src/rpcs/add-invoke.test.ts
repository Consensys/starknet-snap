import { mockWalletInit, createWallet } from '../__tests__/helper';
import { MetaMaskSnap } from '../snap';
import { WalletRpcError } from '../utils/error';
import { WalletAddInvokeTransaction } from './add-invoke';

describe('WalletAddInvokeTransaction', () => {
  const mockInvokeTransaction = (expectedResult) => {
    const spy = jest.spyOn(MetaMaskSnap.prototype, 'addInvoke');
    spy.mockResolvedValue(expectedResult);
    return spy;
  };

  const prepareInvokeTransaction = (expectedResult) => {
    const wallet = createWallet();
    const { initSpy: walletInitSpy } = mockWalletInit({});
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const invokeTransactionSpy = mockInvokeTransaction(expectedResult.transaction_hash);
    return {
      wallet,
      walletInitSpy,
      invokeTransactionSpy,
    };
  };

  it('submits an invoke transaction and returns transaction hash', async () => {
    const calls = [
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        contract_address: '0xabcdef',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        entry_point: 'transfer',
        calldata: ['0x1', '0x2', '0x3'],
      },
    ];
    const expectedResult = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      transaction_hash: '0x12345abcd',
    };

    const { wallet, invokeTransactionSpy } = prepareInvokeTransaction(expectedResult);

    const walletAddInvokeTransaction = new WalletAddInvokeTransaction(wallet);

    const result = await walletAddInvokeTransaction.handleRequest({
      calls,
    });

    expect(result).toStrictEqual(expectedResult.transaction_hash);
    expect(invokeTransactionSpy).toHaveBeenCalledWith(undefined, calls);
  });

  it('throws `WalletRpcError` if invoking transaction fails', async () => {
    const calls = [
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        contract_address: '0xabcdef',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        entry_point: 'transfer',
        calldata: ['0x1', '0x2', '0x3'],
      },
    ];
    const { wallet, invokeTransactionSpy } = prepareInvokeTransaction('0x12345abcd');
    invokeTransactionSpy.mockRejectedValue(new Error('Transaction failed'));

    const walletAddInvokeTransaction = new WalletAddInvokeTransaction(wallet);

    await expect(
      walletAddInvokeTransaction.handleRequest({
        calls,
      }),
    ).rejects.toThrow(WalletRpcError);
  });
});
