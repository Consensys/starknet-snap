import { NetworkStateManager } from '../state/network-state-manager';
import type { Network } from '../types/snapState';
import { STARKNET_MAINNET_NETWORK } from '../utils/constants';
import { getCurrentNetwork } from './get-current-network';

jest.mock('../utils/logger');

describe('getCurrentNetwork', () => {
  const mockNetworkStateManager = ({
    currentNetwork = STARKNET_MAINNET_NETWORK,
  }: {
    currentNetwork?: Network;
  }) => {
    const getCurrentNetworkSpy = jest.spyOn(
      NetworkStateManager.prototype,
      'getCurrentNetwork',
    );

    getCurrentNetworkSpy.mockResolvedValue(currentNetwork);

    return { getCurrentNetworkSpy };
  };

  it('return the selected network', async () => {
    const currentNetwork = STARKNET_MAINNET_NETWORK;
    const { getCurrentNetworkSpy } = mockNetworkStateManager({
      currentNetwork,
    });

    const result = await getCurrentNetwork.execute(null);

    expect(getCurrentNetworkSpy).toHaveBeenCalled();
    expect(result).toStrictEqual({
      name: currentNetwork.name,
      chainId: currentNetwork.chainId,
    });
  });
});
