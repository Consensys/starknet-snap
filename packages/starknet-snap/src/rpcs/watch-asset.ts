import type { Component } from '@metamask/snaps-sdk';
import { divider, heading, row, text } from '@metamask/snaps-sdk';
import type { Infer } from 'superstruct';
import { assign, boolean, min, number, object, optional } from 'superstruct';

import { NetworkStateManager } from '../state/network-state-manager';
import { TokenStateManager } from '../state/token-state-manager';
import type { Erc20Token, Network } from '../types/snapState';
import {
  confirmDialog,
  BaseRequestStruct,
  RpcController,
  AddressStruct,
  TokenNameStruct,
  TokenSymbolStruct,
  isPreloadedToken,
} from '../utils';
import { DEFAULT_DECIMAL_PLACES } from '../utils/constants';
import {
  InvalidNetworkError,
  TokenIsPreloadedError,
  UserRejectedOpError,
} from '../utils/exceptions';
import { getValidNumber } from '../utils/snapUtils';

export const WatchAssetRequestStruct = assign(
  object({
    tokenAddress: AddressStruct,
    tokenName: TokenNameStruct,
    tokenSymbol: TokenSymbolStruct,
    tokenDecimals: optional(min(number(), 0)),
  }),
  BaseRequestStruct,
);

export const WatchAssetResponseStruct = boolean();

export type WatchAssetParams = Infer<typeof WatchAssetRequestStruct>;

export type WatchAssetResponse = Infer<typeof WatchAssetResponseStruct>;

/**
 * The RPC handler to add a ERC20 asset.
 */
export class WatchAssetRpc extends RpcController<
  WatchAssetParams,
  WatchAssetResponse
> {
  protected requestStruct = WatchAssetRequestStruct;

  protected responseStruct = WatchAssetResponseStruct;

  protected readonly tokenStateMgr: TokenStateManager;

  protected readonly networkStateMgr: NetworkStateManager;

  constructor() {
    super();
    this.tokenStateMgr = new TokenStateManager();
    this.networkStateMgr = new NetworkStateManager();
  }

  /**
   * Execute the watch asset request handler.
   * It will promot a dialog to ask user confirmation.
   *
   * @param params - The parameters of the request.
   * @param params.tokenAddress - The address of the token to add.
   * @param params.tokenName - The name of the token to add.
   * @param params.tokenSymbol - The symbol of the token to add.
   * @param params.tokenDecimals - The decimals of the token to add.
   * @param params.chainId - The chain id of the network to switch.
   * @returns the response of adding a asset in boolean.
   * @throws {UserRejectedRequestError} If the user rejects the request.
   * @throws {Error} If the network with the chain id is not supported.
   * @throws {Error} If the token address, name, or symbol is the same as one of the preloaded tokens.
   */
  async execute(params: WatchAssetParams): Promise<WatchAssetResponse> {
    return super.execute(params);
  }

  protected async getNetworkFromChainId(chainId: string): Promise<Network> {
    const network = await this.networkStateMgr.getNetwork({
      chainId,
    });

    // It should be never happen, as the chainId should be validated by the superstruct
    if (!network) {
      throw new InvalidNetworkError() as unknown as Error;
    }

    return network;
  }

  protected buildErc20Token(params: WatchAssetParams): Erc20Token {
    const { chainId, tokenAddress, tokenName, tokenSymbol, tokenDecimals } =
      params;

    // If the token to added is one of the preloaded tokens, we throw an error
    if (
      isPreloadedToken({
        tokenAddress,
        tokenName,
        tokenSymbol,
        chainId,
      })
    ) {
      throw new TokenIsPreloadedError() as unknown as Error;
    }

    const decimalsPlace = getValidNumber(
      tokenDecimals,
      DEFAULT_DECIMAL_PLACES,
      0,
    );

    return {
      address: tokenAddress,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: decimalsPlace,
      chainId,
    };
  }

  protected async handleRequest(
    params: WatchAssetParams,
  ): Promise<WatchAssetResponse> {
    const { chainId } = params;
    const network = await this.getNetworkFromChainId(chainId);

    const erc20Token: Erc20Token = this.buildErc20Token(params);

    if (!(await this.getWatchAssetConsensus(network.name, erc20Token))) {
      throw new UserRejectedOpError() as unknown as Error;
    }

    await this.tokenStateMgr.upsertToken(erc20Token);

    return true;
  }

  protected async getWatchAssetConsensus(
    networkName: string,
    erc20Token: Erc20Token,
  ) {
    const { address, name, symbol, decimals } = erc20Token;

    const componentPairs = [
      {
        label: 'Network',
        value: networkName,
      },
      {
        label: 'Token Address',
        value: address,
      },
      {
        label: 'Token Name',
        value: name,
      },
      {
        label: 'Token Symbol',
        value: symbol,
      },
      {
        label: 'Token Decimals',
        value: decimals.toString(),
      },
    ];
    const components: Component[] = [];
    components.push(heading('Do you want to add this token?'));
    componentPairs.forEach(({ label, value }, idx) => {
      components.push(
        row(
          label,
          text({
            value,
            markdown: false,
          }),
        ),
      );
      if (idx < componentPairs.length - 1) {
        components.push(divider());
      }
    });
    return await confirmDialog(components);
  }
}

export const watchAsset = new WatchAssetRpc();
