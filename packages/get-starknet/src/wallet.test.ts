import { Mutex } from 'async-mutex';
import { Provider } from 'starknet';

import { SepoliaNetwork, mockWalletInit, createWallet, generateAccount, MainnetNetwork } from './__tests__/helper';
import { MetaMaskAccount } from './accounts';
import { WalletSupportedSpecs } from './rpcs';
import type { Network } from './type';
import { MetaMaskSnapWallet } from './wallet';

describe('MetaMaskSnapWallet', () => {
  describe('enable', () => {
    it('returns an account address', async () => {
      const expectedAccountAddress = '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd'; // in hex
      mockWalletInit({
        address: expectedAccountAddress,
      });

      const wallet = createWallet();
      const [address] = await wallet.enable();

      expect(address).toStrictEqual(expectedAccountAddress);
    });
  });

  describe('init', () => {
    it('installs the snap and set the properties', async () => {
      const expectedAccountAddress = '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd'; // in hex

      const { installSpy } = mockWalletInit({
        address: expectedAccountAddress,
      });

      const wallet = createWallet();
      await wallet.init();

      expect(installSpy).toHaveBeenCalled();
      expect(wallet.isConnected).toBe(true);
      expect(wallet.selectedAddress).toStrictEqual(expectedAccountAddress);
      expect(wallet.chainId).toStrictEqual(SepoliaNetwork.chainId);
      expect(wallet.provider).toBeDefined();
      expect(wallet.account).toBeDefined();
    });

    it('does not create the lock if the `createLock` param is false', async () => {
      const runExclusiveSpy = jest.spyOn(Mutex.prototype, 'runExclusive');
      runExclusiveSpy.mockReturnThis();
      mockWalletInit({});

      const wallet = createWallet();
      await wallet.init(false);

      expect(runExclusiveSpy).not.toHaveBeenCalled();
    });

    it('throw `Snap is not installed` error if the snap is not able to install', async () => {
      mockWalletInit({ install: false });

      const wallet = createWallet();
      await expect(wallet.init()).rejects.toThrow('Snap is not installed');
    });

    it('throw `Unable to find the selected network` error if the network is not return from snap', async () => {
      mockWalletInit({ currentNetwork: null as unknown as Network });

      const wallet = createWallet();
      await expect(wallet.init()).rejects.toThrow('Unable to find the selected network');
    });
  });

  describe('account', () => {
    it('returns an account object', async () => {
      mockWalletInit({});

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
      mockWalletInit({});

      const wallet = createWallet();
      await wallet.enable();

      expect(wallet.provider).toBeInstanceOf(Provider);
    });

    it('throw `Network is not set` error if the init has not execute', async () => {
      const wallet = createWallet();

      expect(() => wallet.provider).toThrow('Network is not set');
    });
  });

  describe('request', () => {
    it('executes a request', async () => {
      const spy = jest.spyOn(WalletSupportedSpecs.prototype, 'execute');
      spy.mockReturnThis();

      const wallet = createWallet();
      await wallet.request({ type: 'wallet_supportedSpecs' });

      expect(spy).toHaveBeenCalled();
    });

    it('throws `WalletRpcError` if the request method does not exist', async () => {
      const wallet = createWallet();
      // force the 'invalid_method' as a correct type of the request to test the error
      await expect(wallet.request({ type: 'invalid_method' as unknown as 'wallet_supportedSpecs' })).rejects.toThrow(
        'Method not supported',
      );
    });
  });

  describe('isPreauthorized', () => {
    it('returns true', async () => {
      const wallet = createWallet();
      expect(await wallet.isPreauthorized()).toBe(true);
    });
  });

  describe('on', () => {
    it('adds an event handler and starts polling if not already started', () => {
      mockWalletInit({});

      const wallet = createWallet();
      const handler = jest.fn();

      wallet.on('accountsChanged', handler);
      expect((wallet as any).accountChangeHandlers.has(handler)).toBe(true);
      wallet.off('accountsChanged', handler);
    });

    it('throws an error for unsupported events', () => {
      const wallet = createWallet();
      expect(() => wallet.on('unsupportedEvent' as any, jest.fn())).toThrow('Unsupported event: unsupportedEvent');
    });
  });

  describe('off', () => {
    it('removes an event handler and stops polling if no handlers remain', () => {
      mockWalletInit({});

      const wallet = createWallet();
      const handler = jest.fn();

      wallet.on('accountsChanged', handler);
      wallet.off('accountsChanged', handler);

      expect((wallet as any).accountChangeHandlers.has(handler)).toBe(false);
    });

    it('throws an error for unsupported events', () => {
      const wallet = createWallet();
      expect(() => wallet.off('unsupportedEvent' as any, jest.fn())).toThrow('Unsupported event: unsupportedEvent');
    });
  });

  describe('event handling', () => {
    it('triggers the accountsChanged handler when the event occurs', async () => {
      const { getCurrentAccountSpy } = mockWalletInit({});
      getCurrentAccountSpy.mockReset();

      const wallet = createWallet();
      getCurrentAccountSpy.mockResolvedValueOnce(generateAccount({ address: '0xInitialAddress' }));
      (MetaMaskSnapWallet as any).pollingDelayMs = 0;
      const handler = jest.fn();
      wallet.on('accountsChanged', handler);
      getCurrentAccountSpy.mockResolvedValueOnce(generateAccount({ address: '0xNewAddress' }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).toHaveBeenCalledWith(['0xNewAddress'], undefined);
      wallet.off('accountsChanged', handler);
    });

    it('triggers the networkChanged handler when the event occurs', async () => {
      const { getCurrentNetworkSpy } = mockWalletInit({});
      getCurrentNetworkSpy.mockReset();

      const wallet = createWallet();
      getCurrentNetworkSpy.mockResolvedValueOnce(SepoliaNetwork);
      (MetaMaskSnapWallet as any).pollingDelayMs = 0;
      const handler = jest.fn();
      wallet.on('networkChanged', handler);

      getCurrentNetworkSpy.mockResolvedValueOnce(MainnetNetwork);

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(handler).toHaveBeenCalledWith(MainnetNetwork.chainId, [
        '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
      ]);
      wallet.off('networkChanged', handler);
    });
  });
});
