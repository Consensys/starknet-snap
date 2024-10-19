import { mockWalletInit, createWallet, generateAccount } from '../__tests__/helper';
import { MetaMaskSnap } from '../snap';
import { formatDeclareTransaction } from '../utils/formatter';
import { WalletAddDeclareTransaction } from './add-declare';

/* eslint-disable @typescript-eslint/naming-convention */
describe('WalletAddDeclareTransaction', () => {
  it('submits a declare transaction and returns transaction hash', async () => {
    const params = {
      compiled_class_hash: '0xcompiledClassHash',
      class_hash: '0xclassHash',
      contract_class: {
        sierra_program: ['0x1', '0x2'],
        contract_class_version: '1.0.0',
        entry_points_by_type: {
          CONSTRUCTOR: [{ selector: '0xconstructorSelector', function_idx: 0 }],
          EXTERNAL: [{ selector: '0xexternalSelector', function_idx: 1 }],
          L1_HANDLER: [{ selector: '0xhandlerSelector', function_idx: 2 }],
        },
        abi: '[{"type":"function","name":"transfer"}]', // passing as a string (no parsing)
      },
    };

    const formattedParams = formatDeclareTransaction(params);
    const expectedResult = {
      transaction_hash: '0x12345abcd',
      class_hash: '0x000',
    };

    const wallet = createWallet();
    const account = generateAccount({});
    mockWalletInit({ address: account.address });

    const declareSpy = jest.spyOn(MetaMaskSnap.prototype, 'declare');
    declareSpy.mockResolvedValue(expectedResult);

    const walletAddDeclareTransaction = new WalletAddDeclareTransaction(wallet);
    const result = await walletAddDeclareTransaction.execute(params);

    expect(result).toStrictEqual(expectedResult);
    expect(declareSpy).toHaveBeenCalledWith({
      senderAddress: account.address,
      contractPayload: formattedParams,
      chainId: wallet.chainId,
    });
  });
});
/* eslint-enable @typescript-eslint/naming-convention */
