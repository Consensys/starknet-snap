import type { Json } from '@metamask/snaps-sdk';

import {
  DeployRequiredError,
  UpgradeRequiredError,
} from '../../utils/exceptions';
import { createAccountService } from '../../utils/factory';
import {
  showDeployRequestModal,
  showUpgradeRequestModal,
} from '../../utils/snapUtils';
import type { Account } from '../../wallet/account/account';
import { ChainRpcController } from './chain-rpc-controller';

export type AccountRpcParams = {
  chainId: string;
  address: string;
};

export type AccountRpcControllerOptions = {
  showInvalidAccountAlert: boolean;
};

/**
 * A base class for rpc controllers that require account discovery.
 *
 * @template Request - The expected structure of the request parameters.
 * @template Response - The expected structure of the response.
 * @class AccountRpcController
 */
export abstract class AccountRpcController<
  Request extends AccountRpcParams,
  Response extends Json,
> extends ChainRpcController<Request, Response> {
  protected account: Account;

  protected options: AccountRpcControllerOptions;

  protected defaultOptions: AccountRpcControllerOptions = {
    showInvalidAccountAlert: true,
  };

  constructor(options?: AccountRpcControllerOptions) {
    super();
    this.options = Object.assign({}, this.defaultOptions, options);
  }

  /**
   * A Pre execute hook of the rpc method execution.
   * Derives the account from the address and verifies if it needs to be upgraded or deployed.
   *
   * @param params - The request parameters.
   * @returns The response.
   */
  protected async preExecute(params: Request): Promise<void> {
    await super.preExecute(params);
    const { address } = params;

    const accountService = createAccountService(this.network);
    this.account = await accountService.deriveAccountByAddress(address);

    try {
      await this.verifyAccount();
    } catch (error) {
      await this.displayAlert(error);
      throw error;
    }
  }

  /**
   * Verify if the account needs to be upgraded or deployed and throw an error if it does.
   *
   * @throws {DeployRequiredError} If the account needs to be deployed.
   * @throws {UpgradeRequiredError} If the account needs to be upgraded.
   */
  protected async verifyAccount(): Promise<void> {
    const { accountContract } = this.account;

    if (await accountContract.isRequireUpgrade()) {
      throw new UpgradeRequiredError();
    } else if (await accountContract.isRequireDeploy()) {
      throw new DeployRequiredError();
    }
  }

  /**
   * Show an alert modal if the account needs to be upgraded or deployed, otherwise do nothing.
   * @param error
   */
  protected async displayAlert(error: Error): Promise<void> {
    const { showInvalidAccountAlert: enableAlert } = this.options;

    if (error instanceof UpgradeRequiredError) {
      enableAlert && (await showUpgradeRequestModal());
    } else if (error instanceof DeployRequiredError) {
      enableAlert && (await showDeployRequestModal());
    }
  }
}
