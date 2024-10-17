import { mockWalletInit, createWallet, SepoliaNetwork } from '../__tests__/helper';
import { SupportedStarknetSpecVersion } from '../constants';
import { WalletSupportedSpecs } from './supported-specs';

describe('WalletSupportedWalletApi', () => {
  it('returns the supported wallet api version', async () => {
    const wallet = createWallet();
    mockWalletInit({ currentNetwork: SepoliaNetwork });

    const walletSupportedSpecs = new WalletSupportedSpecs(wallet);
    const result = await walletSupportedSpecs.execute();

    expect(result).toStrictEqual(SupportedStarknetSpecVersion);
  });
});
