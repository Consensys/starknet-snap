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
import type { Network } from './types/snapState';
import { getDappUrl, logger, toJson } from './utils';
import { BlockIdentifierEnum, ETHER_MAINNET } from './utils/constants';
import { createAccountService } from './utils/factory';
import { getTranslator } from './utils/locale';
import { getBalance } from './utils/starknetUtils';
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
   * It returns the component that contains the address, network, and balance for the current account.
   *
   * @returns A promise that resolve to a `OnHomePageResponse` object.
   */
  async execute(): Promise<OnHomePageResponse> {
    try {
      const network = await this.networkStateMgr.getCurrentNetwork();

      const accountService = createAccountService(network);

      const account = await accountService.getCurrentAccount();

      const balance = await this.getBalance(network, account.address);

      // FIXME: The SNAP UI render method in buildComponents is deprecated,
      // However, there is some tricky issue when using JSX components here,
      // so we will keep using the deprecated method for now.
      return this.buildComponents(account.address, network, balance);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.error('Failed to execute onHomePage', toJson(error));

      throw new SnapError('Failed to initialize Snap HomePage');
    }
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
    const translate = getTranslator();
    const panelItems: Component[] = [];
    panelItems.push(text(translate('address')));
    panelItems.push(copyable(`${address}`));
    panelItems.push(row(translate('network'), text(`${network.name}`)));
    panelItems.push(row(translate('balance'), text(`${balance} ETH`)));
    panelItems.push(divider());
    panelItems.push(
      text(translate('visitCompanionDappHomePage', getDappUrl())),
    );
    return {
      content: panel(panelItems),
    };
  }
}

export const homePageController = new HomePageController();
