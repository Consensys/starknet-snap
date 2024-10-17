import { mockWalletInit, createWallet, SepoliaNetwork } from '../__tests__/helper';
import { SupportedWalletApi } from '../constants';
import { WalletSupportedWalletApi } from './supported-wallet-api';

describe('WalletSupportedWalletApi', () => {
  it('returns the supported wallet api version', async () => {
    const wallet = createWallet();
    mockWalletInit({ currentNetwork: SepoliaNetwork });

    const walletSupportedWalletApi = new WalletSupportedWalletApi(wallet);
    const result = await walletSupportedWalletApi.execute();

    expect(result).toStrictEqual(SupportedWalletApi);
  });
});
