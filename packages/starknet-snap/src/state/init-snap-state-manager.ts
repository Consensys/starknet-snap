import type { Component } from '@metamask/snaps-sdk';

import type { SnapState } from '../types/snapState';
import { updateRequiredMetaMaskComponent } from '../utils';
import { StateManager, StateManagerError } from './state-manager';

export class InitSnapStateManager extends StateManager<SnapState> {
  protected getCollection(_state: SnapState) {
    return undefined;
  }

  protected updateEntity(dataInState: SnapState, data: SnapState): void {
    dataInState.requireMMUpgrade = data.requireMMUpgrade;
  }

  /**
   * Ensures that the SnapState has all required default values.
   * If any property is missing, it initializes it with a default value.
   * @returns The fully initialized SnapState.
   */
  public override async get(): Promise<SnapState> {
    return await super.get();
  }

  // Updates the `requireMMUpgrade` flag based on JSX support
  async setJsxSupport(isSupported: boolean): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        this.updateEntity(state, { ...state, requireMMUpgrade: !isSupported });
      });
    } catch (error) {
      throw new StateManagerError(
        'Error updating MetaMask compatibility status',
      );
    }
  }

  async requireMetaMaskUpgrade(): Promise<boolean> {
    let state = await this.get();
    const maxRetries = 10; // Define a maximum number of retries to avoid infinite loop
    let retries = 0;
    const retryInterval = 200; // Set an interval in milliseconds between retries

    while (state.requireMMUpgrade === undefined && retries < maxRetries) {
      // The state can be undefined only if onInstall or onUpdate hook did not complete.
      // Waiting for the state to become defined, as there is no other way to proceed.
      await new Promise((resolve) => setTimeout(resolve, retryInterval)); // Wait before retrying
      state = await this.get();
      retries += 1;
    }

    if (state.requireMMUpgrade === undefined) {
      throw new StateManagerError(
        'MetaMask compatibility state not initialized',
      );
    }

    return state.requireMMUpgrade;
  }

  /**
   * Ensures that JSX support is available in the MetaMask environment by attempting to render a component within a snap dialog.
   * If MetaMask does not support JSX, an alert message is shown prompting the user to update MetaMask.
   *
   * @param component - The JSX component to display in the snap dialog.
   *
   * The function performs the following steps:
   * 1. Tries to render the provided component using a `snap_dialog` method.
   * 2. On success, it updates the `requireMMUpgrade` flag in the snap's state to `false`, indicating that JSX is supported.
   * 3. If an error occurs (likely due to outdated MetaMask), it displays an alert dialog prompting the user to update MetaMask.
   */
  async ensureJsxSupport(component: Component): Promise<void> {
    await this.get();
    try {
      await this.setJsxSupport(true);
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: component,
        },
      });
    } catch {
      await this.setJsxSupport(false);
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: updateRequiredMetaMaskComponent(),
        },
      });
    }
  }
}
