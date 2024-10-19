import typedDataExample from '../../../__tests__/fixture/typedDataExample.json';
import { mockWalletInit, createWallet, SepoliaNetwork, generateAccount } from '../__tests__/helper';
import { SupportedWalletApi } from '../constants';
import { MetaMaskSnap } from '../snap';
import { WalletSignTypedData } from './sign-typed-data';

describe('WalletSignTypedData', () => {
  it('returns the signature', async () => {
    const wallet = createWallet();
    const account = generateAccount({ chainId: SepoliaNetwork.chainId });
    mockWalletInit({ currentNetwork: SepoliaNetwork, address: account.address });
    const expectedResult = ['signature1', 'signature2'];
    const signSpy = jest.spyOn(MetaMaskSnap.prototype, 'signMessage');
    signSpy.mockResolvedValue(expectedResult);

    const walletSignTypedData = new WalletSignTypedData(wallet);
    const result = await walletSignTypedData.execute({
      ...typedDataExample,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      api_version: SupportedWalletApi[0],
    });

    expect(signSpy).toHaveBeenCalledWith(typedDataExample, true, account.address);
    expect(result).toStrictEqual(expectedResult);
  });
});
