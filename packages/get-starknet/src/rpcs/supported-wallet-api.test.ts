import { SupportedWalletApi } from '../constants';
import { WalletSupportedWalletApi } from './supported-wallet-api';

describe('WalletSupportedWalletApi', () => {
  it('returns the supported wallet api version', async () => {
    const walletSupportedWalletApi = new WalletSupportedWalletApi();
    const result = await walletSupportedWalletApi.execute();

    expect(result).toStrictEqual(SupportedWalletApi);
  });
});
