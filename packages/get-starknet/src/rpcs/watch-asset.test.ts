import { mockWalletInit, createWallet, SepoliaNetwork, EthAsset } from '../__tests__/helper';
import { SupportedWalletApi } from '../constants';
import { MetaMaskSnap } from '../snap';
import { WalletWatchAsset } from './watch-asset';

describe('WalletWatchAsset', () => {
  it('watches the specified asset and returns a success response', async () => {
    const wallet = createWallet();
    const network = SepoliaNetwork;
    mockWalletInit({ currentNetwork: network });
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

    expect(watchAssetSpy).toHaveBeenCalledWith({
      address: EthAsset.address,
      symbol: EthAsset.symbol,
      decimals: EthAsset.decimals,
      name: EthAsset.name,
      chainId: network.chainId,
    });
    expect(result).toStrictEqual(expectedResult);
  });
});
