import { mockWalletInit, createWallet, generateAccount } from '../__tests__/helper';
import { MetaMaskSnap } from '../snap';
import { formatCalls } from '../utils/formatter';
import { WalletAddInvokeTransaction } from './add-invoke';

describe('WalletAddInvokeTransaction', () => {
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
    const callsFormated = formatCalls(calls);
    const expectedResult = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      transaction_hash: '0x12345abcd',
    };
    const wallet = createWallet();
    const account = generateAccount({});
    mockWalletInit({ address: account.address });
    const executeSpy = jest.spyOn(MetaMaskSnap.prototype, 'execute');
    executeSpy.mockResolvedValue(expectedResult);

    const walletAddInvokeTransaction = new WalletAddInvokeTransaction(wallet);
    const result = await walletAddInvokeTransaction.execute({
      calls,
    });

    expect(result).toStrictEqual(expectedResult);
    expect(executeSpy).toHaveBeenCalledWith({
      calls: callsFormated,
      address: account.address,
      chainId: wallet.chainId,
    });
  });
});
