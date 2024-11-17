import type { InterfaceContext, UserInputEvent } from '@metamask/snaps-sdk';
import { Box, Heading, Spinner } from '@metamask/snaps-sdk/jsx';

import { NetworkStateManager } from '../state/network-state-manager';
import type { Network, SnapState } from '../types/snapState';
import { updateInterface } from '../ui/utils';
import { logger } from './logger';
import type { Account } from './rpc';
import { getBip44Deriver, getStateData } from './snap';
import { getKeysFromAddress } from './starknetUtils';

export abstract class UserInputController {
  protected progressMessage: string;

  constructor(progressMessage = 'please wait...') {
    this.progressMessage = progressMessage;
  }

  protected abstract handleUserInput(
    id: string,
    event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<void>;

  protected async preExecute(
    id: string,
    event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<void> {
    logger.info(
      `User Input ${id}, ${JSON.stringify(event)} Params: ${JSON.stringify(
        context,
      )}`,
    );

    await updateInterface(
      id,
      <Box alignment="space-between" center={true}>
        <Heading>{this.progressMessage}</Heading>
        <Spinner />
      </Box>,
    );
  }

  async execute(
    id: string,
    event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<void> {
    await this.preExecute(id, event, context);
    await this.handleUserInput(id, event, context);
  }
}

export abstract class AccountUserInputController extends UserInputController {
  protected networkStateMgr: NetworkStateManager;

  protected network: Network;

  protected account: Account;

  constructor() {
    super();
    this.networkStateMgr = new NetworkStateManager();
  }

  protected abstract getSigner(
    id: string,
    event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<string>;

  protected async preExecute(
    id: string,
    event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<void> {
    await super.preExecute(id, event, context);
    await this.setupAccount(await this.getSigner(id, event, context));
  }

  /**
   * Initializes the network and account.
   * @param signer
   */
  protected async setupAccount(signer: string): Promise<void> {
    this.network = await this.networkStateMgr.getCurrentNetwork();
    const deriver = await getBip44Deriver();
    const state = await getStateData<SnapState>();
    this.account = await getKeysFromAddress(
      deriver,
      this.network,
      state,
      signer,
    );
  }
}
