import { Mutex } from 'async-mutex';
import type { WalletEventHandlers } from 'get-starknet-core';
import { Provider } from 'starknet';

import {
  SepoliaNetwork,
  mockWalletInit,
  createWallet,
  generateAccount,
  MainnetNetwork,
  MockMetaMaskSnapWallet,
} from './__tests__/helper';
import { MetaMaskAccount } from './accounts';
import { WalletSupportedSpecs } from './rpcs';
import type { Network } from './type';

describe('MetaMaskSnapWallet', () => {
  const setupEventTest = async (eventName: keyof WalletEventHandlers) => {
    const handlers = [jest.fn(), jest.fn()];
    const wallet = createWallet();

    for (const handler of handlers) {
      wallet.on(eventName, handler);
    }

    // Having a delay to make sure the polling is done
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Due to polling operation is a endless loop, we need to stop it manually,
    for (const handler of handlers) {
      wallet.off(eventName, handler);
    }

    return { handlers, wallet };
  };

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
    it('adds an event handler and starts polling if not already started', async () => {
      mockWalletInit({});
      const addHandlerSpy = jest.spyOn(Set.prototype, 'add');
      const startPollingSpy = jest.spyOn(MockMetaMaskSnapWallet.prototype, 'startPolling');

      const { handlers } = await setupEventTest('accountsChanged');

      expect(addHandlerSpy).toHaveBeenCalledTimes(handlers.length);
      for (let i = 0; i < handlers.length; i++) {
        expect(addHandlerSpy).toHaveBeenNthCalledWith(i + 1, handlers[i]);
      }
      expect(startPollingSpy).toHaveBeenCalledTimes(1);
    });

    it('throws an error for unsupported events', () => {
      const wallet = createWallet();

      expect(() => wallet.on('unsupportedEvent' as any, jest.fn())).toThrow('Unsupported event: unsupportedEvent');
    });
  });

  describe('off', () => {
    it('removes an event handler and stops polling if no handlers remain', async () => {
      mockWalletInit({});
      const deleteHandlerSpy = jest.spyOn(Set.prototype, 'delete');
      const stopPollingSpy = jest.spyOn(MockMetaMaskSnapWallet.prototype, 'stopPolling');

      const { handlers } = await setupEventTest('accountsChanged');

      expect(deleteHandlerSpy).toHaveBeenCalledTimes(handlers.length);
      for (let i = 0; i < handlers.length; i++) {
        expect(deleteHandlerSpy).toHaveBeenNthCalledWith(i + 1, handlers[i]);
      }
      expect(stopPollingSpy).toHaveBeenCalledTimes(1);
    });

    it('throws an error for unsupported events', () => {
      const wallet = createWallet();
      expect(() => wallet.off('unsupportedEvent' as any, jest.fn())).toThrow('Unsupported event: unsupportedEvent');
    });
  });

  describe('event handling', () => {
    it('triggers the accountsChanged handler when the event occurs', async () => {
      const { address: initialAddress } = generateAccount({ address: '0xInitialAddress' });
      const { address: newAddress } = generateAccount({ address: '0xNewAddress' });

      // The code simulates a scenario where the initial address is the default account address.
      // Later, the address is changed to a new address and remains unchanged.
      // - `mockResolvedValueOnce` sets the initial address as the default account address.
      // - `mockResolvedValue` from `mockWalletInit` sets the new address as the new default.
      const { getCurrentAccountSpy } = mockWalletInit({ address: newAddress });
      getCurrentAccountSpy.mockResolvedValueOnce(generateAccount({ address: initialAddress }));

      const { handlers } = await setupEventTest('accountsChanged');

      for (const handler of handlers) {
        expect(handler).toHaveBeenCalledWith([newAddress], undefined);
      }
    });

    it('triggers the networkChanged handler when the event occurs', async () => {
      // The code simulates a scenario where the MainnetNetwork is the default network.
      // Later, the network is changed to SepoliaNetwork and remains unchanged.
      // - `mockResolvedValueOnce` sets the MainnetNetwork as the default network.
      // - `mockResolvedValue` from `mockWalletInit` sets the SepoliaNetwork as the new network.
      const { address } = generateAccount({});
      const { getCurrentNetworkSpy } = mockWalletInit({ currentNetwork: SepoliaNetwork, address });
      getCurrentNetworkSpy.mockResolvedValueOnce(MainnetNetwork);

      const { handlers } = await setupEventTest('networkChanged');

      for (const handler of handlers) {
        expect(handler).toHaveBeenCalledWith(SepoliaNetwork.chainId, [address]);
      }
    });
  });
});
