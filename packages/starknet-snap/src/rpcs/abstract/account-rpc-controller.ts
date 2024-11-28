import type { getBIP44ChangePathString } from '@metamask/key-tree/dist/types/utils';
import type { Json } from '@metamask/snaps-sdk';

import type { Network, SnapState } from '../../types/snapState';
import { getBip44Deriver, getStateData } from '../../utils';
import {
  getNetworkFromChainId,
  verifyIfAccountNeedUpgradeOrDeploy,
} from '../../utils/snapUtils';
import { getKeysFromAddress } from '../../utils/starknetUtils';
import { RpcController } from './base-rpc-controller';

export type AccountRpcParams = {
  chainId: string;
  address: string;
};

// TODO: the Account object should move into a account manager for generate account
export type Account = {
  privateKey: string;
  publicKey: string;
  addressIndex: number;
  // This is the derivation path of the address, it is used in `getNextAddressIndex` to find the account in state where matching the same derivation path
  derivationPath: ReturnType<typeof getBIP44ChangePathString>;
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
> extends RpcController<Request, Response> {
  protected account: Account;

  protected network: Network;

  protected options: AccountRpcControllerOptions;

  protected defaultOptions: AccountRpcControllerOptions = {
    showInvalidAccountAlert: true,
  };

  constructor(options?: AccountRpcControllerOptions) {
    super();
    this.options = Object.assign({}, this.defaultOptions, options);
  }

  protected async preExecute(params: Request): Promise<void> {
    await super.preExecute(params);

    const { chainId, address } = params;
    const { showInvalidAccountAlert } = this.options;

    const deriver = await getBip44Deriver();
    // TODO: Instead of getting the state directly, we should implement state management to consolidate the state fetching
    const state = await getStateData<SnapState>();

    // TODO: getNetworkFromChainId from state is still needed, due to it is supporting in get-starknet at this moment
    this.network = getNetworkFromChainId(state, chainId);

    // TODO: This method should be refactored to get the account from an account manager
    this.account = await getKeysFromAddress(
      deriver,
      this.network,
      state,
      address,
    );

    // TODO: rename this method to verifyAccount
    await verifyIfAccountNeedUpgradeOrDeploy(
      this.network,
      address,
      this.account.publicKey,
      showInvalidAccountAlert,
    );
  }
}
