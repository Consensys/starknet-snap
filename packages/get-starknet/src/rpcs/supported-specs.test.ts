import { SupportedStarknetSpecVersion } from '../constants';
import { WalletSupportedSpecs } from './supported-specs';

describe('WalletSupportedWalletApi', () => {
  it('returns the supported wallet api version', async () => {
    const walletSupportedSpecs = new WalletSupportedSpecs();
    const result = await walletSupportedSpecs.execute();

    expect(result).toStrictEqual(SupportedStarknetSpecVersion);
  });
});
