import type { Component, OnHomePageResponse } from '@metamask/snaps-sdk';
import {
  SnapError,
  copyable,
  divider,
  panel,
  row,
  text,
} from '@metamask/snaps-sdk';
import { ethers } from 'ethers';

import { NetworkStateManager } from './state/network-state-manager';
import type { Network, SnapState } from './types/snapState';
import {
  getBip44Deriver,
  getDappUrl,
  getStateData,
  logger,
  toJson,
} from './utils';
import { BlockIdentifierEnum, ETHER_MAINNET } from './utils/constants';
import {
  getBalance,
  getCorrectContractAddress,
  getKeysFromAddressIndex,
} from './utils/starknetUtils';

/**
 * The onHomePage handler to execute the home page event operation.
 */
export class HomePageController {
  networkStateMgr: NetworkStateManager;

  constructor() {
    this.networkStateMgr = new NetworkStateManager();
  }

  /**
   * Execute the on home page event operation.
   * It derives an account address with index 0 and retrieves the spendable balance of ETH.
   * It returns a snap panel component with the address, network, and balance.
   *
   * @returns A promise that resolve to a OnHomePageResponse object.
   */
  async execute(): Promise<OnHomePageResponse> {
    try {
      const network = await this.networkStateMgr.getCurrentNetwork();

      const address = await this.getAddress(network);

      const balance = await this.getBalance(network, address);

      return this.buildComponents(address, network, balance);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.error('Failed to execute onHomePage', toJson(error));

      throw new SnapError('Failed to initialize Snap HomePage');
    }
  }

  protected async getAddress(network: Network): Promise<string> {
    const deriver = await getBip44Deriver();
    const state = await getStateData<SnapState>();

    const { publicKey } = await getKeysFromAddressIndex(
      deriver,
      network.chainId,
      state,
      0,
    );

    const { address } = await getCorrectContractAddress(network, publicKey);

    return address;
  }

  protected async getBalance(
    network: Network,
    address: string,
  ): Promise<string> {
    // As the snap only accept mainnet / sepolia testnet, and ETH token address are same across all networks
    // hence we can hardcode the token
    const ethToken = ETHER_MAINNET;

    // Align with the FE Dapp to use the pending block for enquiry the account balance
    const balance = await getBalance(
      address,
      ethToken.address,
      network,
      BlockIdentifierEnum.Pending,
    );

    return ethers.utils.formatUnits(
      ethers.BigNumber.from(balance),
      ethToken.decimals,
    );
  }

  protected buildComponents(
    address: string,
    network: Network,
    balance: string,
  ): OnHomePageResponse {
    const panelItems: Component[] = [];
    panelItems.push(text('Address'));
    panelItems.push(copyable(`${address}`));
    panelItems.push(row('Network', text(`${network.name}`)));
    panelItems.push(row('Balance', text(`${balance} ETH`)));
    panelItems.push(divider());
    panelItems.push(
      text(
        `Visit the [companion dapp for Starknet](${getDappUrl()}) to manage your account.`,
      ),
    );
    return {
      content: panel(panelItems),
    };
  }
}

export const homePageController = new HomePageController();
