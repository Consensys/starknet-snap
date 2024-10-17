import { mockWalletInit, MainnetNetwork, createWallet, SepoliaNetwork } from '../__tests__/helper';
import { MetaMaskSnap } from '../snap';
import type { Network } from '../type';
import { WalletRpcError } from '../utils/error';
import { WalletSwitchStarknetChain } from './switch-network';

describe('WalletSwitchStarknetChain', () => {
  const mockSwitchNetwork = (result: boolean) => {
    const spy = jest.spyOn(MetaMaskSnap.prototype, 'switchNetwork');
    spy.mockResolvedValue(result);
    return spy;
  };

  const prepareSwitchNetwork = (result: boolean, network?: Network) => {
    const wallet = createWallet();
    const { initSpy: walletInitSpy } = mockWalletInit({ currentNetwork: network });
    const switchNetworkSpy = mockSwitchNetwork(result);
    return {
      wallet,
      walletInitSpy,
      switchNetworkSpy,
    };
  };

  it('switchs the network', async () => {
    const expectedResult = true;
    const { wallet, switchNetworkSpy, walletInitSpy } = prepareSwitchNetwork(expectedResult);

    const walletSwitchStarknetChain = new WalletSwitchStarknetChain(wallet);
    const result = await walletSwitchStarknetChain.execute({ chainId: MainnetNetwork.chainId });

    expect(result).toBe(expectedResult);
    expect(switchNetworkSpy).toHaveBeenCalledWith(MainnetNetwork.chainId);
    // Init will be called before and after switching the network
    // because the wallet will be re-initialized after switching the network
    expect(walletInitSpy).toHaveBeenCalledTimes(2);
  });

  it('returns true directly if the request network is the same with the current network', async () => {
    const requestNetwork = SepoliaNetwork;
    const { wallet, switchNetworkSpy, walletInitSpy } = prepareSwitchNetwork(true, requestNetwork);

    const walletSwitchStarknetChain = new WalletSwitchStarknetChain(wallet);
    const result = await walletSwitchStarknetChain.execute({ chainId: requestNetwork.chainId });

    expect(switchNetworkSpy).not.toHaveBeenCalled();
    expect(result).toBe(true);
    // If the request network is the same with the current network, init will be called once
    expect(walletInitSpy).toHaveBeenCalledTimes(1);
  });

  it('throws `WalletRpcError` if switching network failed', async () => {
    const { wallet, switchNetworkSpy } = prepareSwitchNetwork(false);
    switchNetworkSpy.mockRejectedValue(new Error('Switch network failed'));

    const walletSwitchStarknetChain = new WalletSwitchStarknetChain(wallet);

    await expect(walletSwitchStarknetChain.execute({ chainId: MainnetNetwork.chainId })).rejects.toThrow(
      WalletRpcError,
    );
  });
});
