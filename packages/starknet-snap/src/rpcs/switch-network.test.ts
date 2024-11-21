import type { constants } from 'starknet';

import { Config } from '../config';
import { NetworkStateManager } from '../state/network-state-manager';
import type { Network } from '../types/snapState';
import {
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  STARKNET_MAINNET_NETWORK,
} from '../utils/constants';
import {
  InvalidNetworkError,
  InvalidRequestParamsError,
  UserRejectedOpError,
} from '../utils/exceptions';
import { prepareRenderSwitchNetworkUI } from './__tests__/helper';
import { switchNetwork } from './switch-network';
import type { SwitchNetworkParams } from './switch-network';

jest.mock('../utils/logger');

describe('switchNetwork', () => {
  const createRequestParam = (
    chainId: constants.StarknetChainId | string,
    enableAuthorize?: boolean,
  ): SwitchNetworkParams => {
    const request: SwitchNetworkParams = {
      chainId: chainId as constants.StarknetChainId,
    };
    if (enableAuthorize) {
      request.enableAuthorize = enableAuthorize;
    }
    return request;
  };

  const mockNetworkStateManager = ({
    network = STARKNET_SEPOLIA_TESTNET_NETWORK,
    currentNetwork = STARKNET_MAINNET_NETWORK,
  }: {
    network?: Network | null;
    currentNetwork?: Network;
  }) => {
    const txStateSpy = jest.spyOn(
      NetworkStateManager.prototype,
      'withTransaction',
    );
    const getNetworkSpy = jest.spyOn(
      NetworkStateManager.prototype,
      'getNetwork',
    );
    const setCurrentNetworkSpy = jest.spyOn(
      NetworkStateManager.prototype,
      'setCurrentNetwork',
    );
    const getCurrentNetworkSpy = jest.spyOn(
      NetworkStateManager.prototype,
      'getCurrentNetwork',
    );

    getNetworkSpy.mockResolvedValue(network);
    getCurrentNetworkSpy.mockResolvedValue(currentNetwork);
    txStateSpy.mockImplementation(async (fn) => {
      return await fn({
        accContracts: [],
        erc20Tokens: [],
        networks: Config.availableNetworks,
        transactions: [],
      });
    });

    return { getNetworkSpy, setCurrentNetworkSpy, getCurrentNetworkSpy };
  };

  it('switchs a network correctly', async () => {
    const currentNetwork = STARKNET_MAINNET_NETWORK;
    const requestNetwork = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const { getNetworkSpy, setCurrentNetworkSpy, getCurrentNetworkSpy } =
      mockNetworkStateManager({
        currentNetwork,
        network: requestNetwork,
      });
    const request = createRequestParam(requestNetwork.chainId);

    const result = await switchNetwork.execute(request);

    expect(result).toBe(true);
    expect(getCurrentNetworkSpy).toHaveBeenCalled();
    expect(getNetworkSpy).toHaveBeenCalledWith(
      { chainId: requestNetwork.chainId },
      expect.anything(),
    );
    expect(setCurrentNetworkSpy).toHaveBeenCalledWith(requestNetwork);
  });

  it('returns `true` if the request chainId is the same with current network', async () => {
    const currentNetwork = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const requestNetwork = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const { getNetworkSpy, setCurrentNetworkSpy, getCurrentNetworkSpy } =
      mockNetworkStateManager({
        currentNetwork,
        network: requestNetwork,
      });
    const request = createRequestParam(requestNetwork.chainId);

    const result = await switchNetwork.execute(request);

    expect(result).toBe(true);
    expect(getCurrentNetworkSpy).toHaveBeenCalled();
    expect(getNetworkSpy).not.toHaveBeenCalled();
    expect(setCurrentNetworkSpy).not.toHaveBeenCalled();
  });

  it('renders confirmation dialog', async () => {
    const currentNetwork = STARKNET_MAINNET_NETWORK;
    const requestNetwork = STARKNET_SEPOLIA_TESTNET_NETWORK;
    mockNetworkStateManager({
      currentNetwork,
      network: requestNetwork,
    });
    const { confirmDialogSpy } = prepareRenderSwitchNetworkUI();
    const request = createRequestParam(requestNetwork.chainId, true);

    await switchNetwork.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledWith({
      chainId: requestNetwork.chainId,
      name: requestNetwork.name,
    });
  });

  it('throws `UserRejectedRequestError` if user denied the operation', async () => {
    const currentNetwork = STARKNET_MAINNET_NETWORK;
    const requestNetwork = STARKNET_SEPOLIA_TESTNET_NETWORK;
    mockNetworkStateManager({
      currentNetwork,
      network: requestNetwork,
    });
    const { confirmDialogSpy } = prepareRenderSwitchNetworkUI();
    confirmDialogSpy.mockResolvedValue(false);
    const request = createRequestParam(requestNetwork.chainId, true);

    await expect(switchNetwork.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it('throws `Network not supported` error if the request network is not support', async () => {
    const currentNetwork = STARKNET_MAINNET_NETWORK;
    const requestNetwork = STARKNET_SEPOLIA_TESTNET_NETWORK;
    // Mock the network state manager to return null network
    // even if the request chain id is not block by the superstruct
    mockNetworkStateManager({
      currentNetwork,
      network: null,
    });
    const request = createRequestParam(requestNetwork.chainId);

    await expect(switchNetwork.execute(request)).rejects.toThrow(
      InvalidNetworkError,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      switchNetwork.execute({} as unknown as SwitchNetworkParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
