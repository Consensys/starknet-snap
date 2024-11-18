import type { InterfaceContext, UserInputEvent } from '@metamask/snaps-sdk';
import { Box, Heading, Spinner } from '@metamask/snaps-sdk/jsx';

import { NetworkStateManager } from '../state/network-state-manager';
import type { Network, SnapState } from '../types/snapState';
import { updateInterface } from '../ui/utils';
import { logger } from './logger';
import type { Account } from './rpc';
import { getBip44Deriver, getStateData } from './snap';
import { getKeysFromAddress } from './starknetUtils';

/**
 * Abstract base class for handling user input in interactive UI within a JSX Snap.
 * This class provides a mechanism for displaying a progress message and executing
 * user input handlers.
 */
export abstract class UserInputController {
  protected progressMessage: string;

  constructor(progressMessage = 'please wait...') {
    this.progressMessage = progressMessage;
  }

  /**
   * Abstract method to handle user input events. Must be implemented by subclasses.
   * @param id - The unique identifier for the interface.
   * @param event - The user input event data.
   * @param context - Additional context from the interface, if any.
   * @returns A promise that resolves when input handling is complete.
   */
  protected abstract handleUserInput(
    id: string,
    event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<void>;

  /**
   * Prepares the interface before executing the user input handler.
   * This includes logging and updating the UI to show a loading state.
   * @param id - The unique identifier for the interface.
   * @param event - The user input event data.
   * @param context - Additional context from the interface, if any.
   * @returns A promise that resolves when preparation is complete.
   */
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

  /**
   * Executes the user input handling process. This includes preparation and
   * handling the input through the abstract handler method.
   * @param id - The unique identifier for the interface.
   * @param event - The user input event data.
   * @param context - Additional context from the interface, if any.
   * @returns A promise that resolves when execution is complete.
   */
  async execute(
    id: string,
    event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<void> {
    await this.preExecute(id, event, context);
    await this.handleUserInput(id, event, context);
  }
}

/**
 * Abstract base class for handling user input in interactive UI for accounts.
 * This class extends `UserInputController` and includes account and network
 * management functionality.
 */
export abstract class AccountUserInputController extends UserInputController {
  protected networkStateMgr: NetworkStateManager;

  protected network: Network;

  protected account: Account;

  constructor() {
    super();
    this.networkStateMgr = new NetworkStateManager();
  }

  /**
   * Abstract method to retrieve the signer information for the user input event.
   * Must be implemented by subclasses. Usually signer is retrieved from the RequestStateManager
   * @param id - The unique identifier for the interface.
   * @param event - The user input event data.
   * @param context - Additional context from the interface, if any.
   * @returns A promise that resolves with the signer information.
   */
  protected abstract getSigner(
    id: string,
    event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<string>;

  /**
   * Prepares the interface and initializes the account before handling user input.
   * This includes fetching the signer and setting up the account context.
   * @param id - The unique identifier for the interface.
   * @param event - The user input event data.
   * @param context - Additional context from the interface, if any.
   * @returns A promise that resolves when preparation is complete.
   */
  protected async preExecute(
    id: string,
    event: UserInputEvent,
    context: InterfaceContext | null,
  ): Promise<void> {
    await super.preExecute(id, event, context);
    await this.setupAccount(await this.getSigner(id, event, context));
  }

  /**
   * Initializes the network and account state using the provided signer.
   * @param signer - The signer information retrieved from the user input event.
   * @returns A promise that resolves when the network and account are initialized.
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
