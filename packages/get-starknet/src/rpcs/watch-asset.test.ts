import { mockWalletInit, createWallet, SepoliaNetwork, EthAsset } from '../__tests__/helper';
import { SupportedWalletApi } from '../constants';
import { MetaMaskSnap } from '../snap';
import { WalletWatchAsset } from './watch-asset';

describe('WalletWatchAsset', () => {
  it('returns the signature', async () => {
    const wallet = createWallet();
    mockWalletInit({ currentNetwork: SepoliaNetwork });
    const expectedResult = true;
    const watchAssetSpy = jest.spyOn(MetaMaskSnap.prototype, 'watchAsset');
    watchAssetSpy.mockResolvedValue(expectedResult);

    const walletWatchAsset = new WalletWatchAsset(wallet);
    const result = await walletWatchAsset.execute({
      type: 'ERC20',
      options: EthAsset,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      api_version: SupportedWalletApi[0],
    });

    expect(watchAssetSpy).toHaveBeenCalledWith(EthAsset.address, EthAsset.name, EthAsset.symbol, EthAsset.decimals);
    expect(result).toStrictEqual(expectedResult);
  });
});
