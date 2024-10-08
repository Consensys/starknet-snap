import { Provider } from 'starknet';

import { generateAccount, SepoliaNetwork } from './__tests__/helper';
import { MetaMaskAccount } from './accounts';
import { MetaMaskSnap } from './snap';
import type { MetaMaskProvider, Network } from './type';
import { MetaMaskSnapWallet } from './wallet';

describe('MetaMaskSnapWallet', () => {
  class MockProvider implements MetaMaskProvider {
    request = jest.fn();
  }

  const createWallet = () => {
    return new MetaMaskSnapWallet(new MockProvider(), '*');
  };

  describe('enable', () => {
    it('returns an account address', async () => {
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
    });
  });

  describe('init', () => {
    it('installs the snap and set the properties', async () => {
      const expectedAccountAddress = '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd'; // in hex
      const installSpy = jest.spyOn(MetaMaskSnap.prototype, 'installIfNot');
      jest.spyOn(MetaMaskSnap.prototype, 'getCurrentNetwork').mockResolvedValue(SepoliaNetwork);
      jest.spyOn(MetaMaskSnap.prototype, 'recoverDefaultAccount').mockResolvedValue(
        generateAccount({
          address: expectedAccountAddress,
        }),
      );
      installSpy.mockResolvedValue(true);

      const wallet = createWallet();
      await wallet.init();

      expect(installSpy).toHaveBeenCalled();
      expect(wallet.isConnected).toBe(true);
      expect(wallet.selectedAddress).toStrictEqual(expectedAccountAddress);
      expect(wallet.chainId).toStrictEqual(SepoliaNetwork.chainId);
      expect(wallet.provider).toBeDefined();
      expect(wallet.account).toBeDefined();
    });

    it('set the properties base on the given network', async () => {
      const expectedAccountAddress = '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd'; // in hex
      const installSpy = jest.spyOn(MetaMaskSnap.prototype, 'installIfNot');
      jest.spyOn(MetaMaskSnap.prototype, 'getCurrentNetwork');
      jest.spyOn(MetaMaskSnap.prototype, 'recoverDefaultAccount').mockResolvedValue(
        generateAccount({
          address: expectedAccountAddress,
        }),
      );
      installSpy.mockResolvedValue(true);

      const wallet = createWallet();
      await wallet.init(SepoliaNetwork);

      expect(installSpy).toHaveBeenCalled();
      expect(wallet.isConnected).toBe(true);
      expect(wallet.selectedAddress).toStrictEqual(expectedAccountAddress);
      expect(wallet.chainId).toStrictEqual(SepoliaNetwork.chainId);
      expect(wallet.provider).toBeDefined();
      expect(wallet.account).toBeDefined();
    });

    it('throw `Snap is not installed` error if the snap is not able to install', async () => {
      jest.spyOn(MetaMaskSnap.prototype, 'installIfNot').mockResolvedValue(false);

      const wallet = createWallet();
      await expect(wallet.init()).rejects.toThrow('Snap is not installed');
    });

    it('throw `Unable to find the selected network` error if the network is not return from snap', async () => {
      jest.spyOn(MetaMaskSnap.prototype, 'installIfNot').mockResolvedValue(true);
      jest.spyOn(MetaMaskSnap.prototype, 'getCurrentNetwork').mockResolvedValue(null as unknown as Network);

      const wallet = createWallet();
      await expect(wallet.init()).rejects.toThrow('Unable to find the selected network');
    });
  });

  describe('account', () => {
    it('returns an account object', async () => {
      jest.spyOn(MetaMaskSnap.prototype, 'installIfNot').mockResolvedValue(true);
      jest.spyOn(MetaMaskSnap.prototype, 'getCurrentNetwork').mockResolvedValue(SepoliaNetwork);
      jest.spyOn(MetaMaskSnap.prototype, 'recoverDefaultAccount').mockResolvedValue(generateAccount({}));

      const wallet = createWallet();
      await wallet.enable();

      expect(wallet.account).toBeInstanceOf(MetaMaskAccount);
    });

    it('throw `Address is not set` error if the init has not execute', async () => {
      const wallet = createWallet();

      expect(() => wallet.account).toThrow('Address is not set');
    });
  });

  describe('provider', () => {
    it('returns an provider object', async () => {
      jest.spyOn(MetaMaskSnap.prototype, 'installIfNot').mockResolvedValue(true);
      jest.spyOn(MetaMaskSnap.prototype, 'getCurrentNetwork').mockResolvedValue(SepoliaNetwork);
      jest.spyOn(MetaMaskSnap.prototype, 'recoverDefaultAccount').mockResolvedValue(generateAccount({}));

      const wallet = createWallet();
      await wallet.enable();

      expect(wallet.provider).toBeInstanceOf(Provider);
    });

    it('throw `Network is not set` error if the init has not execute', async () => {
      const wallet = createWallet();

      expect(() => wallet.provider).toThrow('Network is not set');
    });
  });
});
