import { generateAccount, SepoliaNetwork } from './__tests__/helper';
import { MetaMaskSnap } from './snap';
import type { MetaMaskProvider } from './type';
import { MetaMaskSnapWallet } from './wallet';

describe('MetaMaskSnapWallet', () => {
  class MockProvider implements MetaMaskProvider {
    request = jest.fn();
  }

  const createWallet = () => {
    return new MetaMaskSnapWallet(new MockProvider(), '*');
  };

  describe('enable', () => {
    it('installs the snap and return default account', async () => {
      const expectedAccountAddress = '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd'; // in hex
      jest.spyOn(MetaMaskSnap.prototype, 'installIfNot').mockResolvedValue(true);
      jest.spyOn(MetaMaskSnap.prototype, 'getCurrentNetwork').mockResolvedValue(SepoliaNetwork);
      jest.spyOn(MetaMaskSnap.prototype, 'recoverDefaultAccount').mockResolvedValue(
        generateAccount({
          address: expectedAccountAddress,
        }),
      );

      const wallet = createWallet();
      const [address] = await wallet.enable();

      expect(address).toStrictEqual(expectedAccountAddress);
      expect(wallet.isConnected).toBe(true);
      expect(wallet.selectedAddress).toStrictEqual(expectedAccountAddress);
      expect(wallet.chainId).toStrictEqual(SepoliaNetwork.chainId);
      expect(wallet.provider).toBeDefined();
      expect(wallet.account).toBeDefined();
    });
  });
});
