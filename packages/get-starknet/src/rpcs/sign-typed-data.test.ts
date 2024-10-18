import typedDataExample from '../../../__tests__/fixture/typedDataExample.json';
import { mockWalletInit, createWallet, SepoliaNetwork } from '../__tests__/helper';
import { SupportedWalletApi } from '../constants';
import { MetaMaskSnap } from '../snap';
import { WalletSignTypedData } from './sign-typed-data';

describe('WalletSignTypedData', () => {
  it('returns the signature', async () => {
    const wallet = createWallet();
    mockWalletInit({ currentNetwork: SepoliaNetwork });
    const expectedResult = ['signature1', 'signature2'];
    const signSpy = jest.spyOn(MetaMaskSnap.prototype, 'signMessage');
    signSpy.mockResolvedValue(expectedResult);

    const walletSignTypedData = new WalletSignTypedData(wallet);
    const result = await walletSignTypedData.execute({
      ...typedDataExample,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      api_version: SupportedWalletApi[0],
    });

    expect(signSpy).toHaveBeenCalledWith(typedDataExample, true, SepoliaNetwork.chainId);
    expect(result).toStrictEqual(expectedResult);
  });
});
