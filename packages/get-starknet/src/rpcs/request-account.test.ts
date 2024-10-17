import { mockWalletInit, createWallet } from '../__tests__/helper';
import { WalletRequestAccount } from './request-account';

describe('WalletRequestAccount', () => {
  it('returns accounts', async () => {
    const expectedAccountAddress = '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd';
    const wallet = createWallet();
    mockWalletInit({ address: expectedAccountAddress });

    const walletRequestAccount = new WalletRequestAccount(wallet);
    const result = await walletRequestAccount.execute();

    expect(result).toStrictEqual([expectedAccountAddress]);
  });
});
