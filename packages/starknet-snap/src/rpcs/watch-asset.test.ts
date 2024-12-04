import { constants } from 'starknet';

import { Config } from '../config';
import { NetworkStateManager } from '../state/network-state-manager';
import { TokenStateManager } from '../state/token-state-manager';
import type { Network } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  InvalidRequestParamsError,
  TokenIsPreloadedError,
  InvalidNetworkError,
  UserRejectedOpError,
} from '../utils/exceptions';
import { prepareRenderWatchAssetUI } from './__tests__/helper';
import type { WatchAssetParams } from './watch-asset';
import { watchAsset } from './watch-asset';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

describe('WatchAssetRpc', () => {
  const createRequest = ({
    chainId = constants.StarknetChainId.SN_SEPOLIA,
    tokenName = 'Valid Token',
    tokenSymbol = 'VT',
    tokenAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004d99',
    tokenDecimals = 18,
  }: {
    chainId?: constants.StarknetChainId;
    tokenName?: string;
    tokenSymbol?: string;
    tokenDecimals?: number;
    tokenAddress?: string;
  }) => ({
    tokenAddress,
    tokenName,
    tokenSymbol,
    tokenDecimals,
    chainId,
  });

  const mockNetworkStateManager = ({
    network,
  }: {
    network: Network | null;
  }) => {
    const getNetworkSpy = jest.spyOn(
      NetworkStateManager.prototype,
      'getNetwork',
    );

    getNetworkSpy.mockResolvedValue(network);

    return { getNetworkSpy };
  };

  const mockTokenStateManager = () => {
    const upsertTokenSpy = jest.spyOn(
      TokenStateManager.prototype,
      'upsertToken',
    );

    return { upsertTokenSpy };
  };

  const prepareWatchAssetTest = async ({
    network = STARKNET_SEPOLIA_TESTNET_NETWORK,
  }: {
    network?: Network;
  }) => {
    const request = createRequest({
      chainId: network.chainId as unknown as constants.StarknetChainId,
    });
    const { confirmDialogSpy } = prepareRenderWatchAssetUI();
    const { getNetworkSpy } = mockNetworkStateManager({
      network,
    });
    const { upsertTokenSpy } = mockTokenStateManager();

    return {
      getNetworkSpy,
      confirmDialogSpy,
      upsertTokenSpy,
      request,
    };
  };

  it('returns true if the token is added', async () => {
    const { request } = await prepareWatchAssetTest({});

    const expectedResult = true;

    const result = await watchAsset.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const { request, confirmDialogSpy } = await prepareWatchAssetTest({
      network,
    });

    await watchAsset.execute(request);
    expect(confirmDialogSpy).toHaveBeenCalledWith({
      chainId: network.chainId,
      networkName: network.name,
      token: {
        address: request.tokenAddress,
        chainId: request.chainId,
        decimals: request.tokenDecimals,
        name: request.tokenName,
        symbol: request.tokenSymbol,
      },
    });
  });

  it('throws `InvalidNetworkError` if the network can not be found', async () => {
    const { request, getNetworkSpy } = await prepareWatchAssetTest({});
    getNetworkSpy.mockResolvedValue(null);

    await expect(watchAsset.execute(request)).rejects.toThrow(
      InvalidNetworkError,
    );
  });

  it('throws `TokenIsPreloadedError` if the given token is one of the preloaded tokens', async () => {
    const preloadedToken = Config.preloadTokens[0];
    const { address, symbol, decimals, name, chainId } = preloadedToken;
    // Ensure the network is matching the preloaded token
    const network = Config.availableNetworks.find(
      (net) => net.chainId === chainId,
    );
    await prepareWatchAssetTest({
      network,
    });
    const request = createRequest({
      tokenAddress: address,
      tokenName: name,
      tokenSymbol: symbol,
      tokenDecimals: decimals,
      chainId: chainId as unknown as constants.StarknetChainId,
    });

    await expect(watchAsset.execute(request)).rejects.toThrow(
      TokenIsPreloadedError,
    );
  });

  it('throws `UserRejectedOpError` if user denied the operation', async () => {
    const { request, confirmDialogSpy } = await prepareWatchAssetTest({});
    confirmDialogSpy.mockResolvedValue(false);

    await expect(watchAsset.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      watchAsset.execute({} as unknown as WatchAssetParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
