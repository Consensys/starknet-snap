import type { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import type { Component, DialogResult, Json } from '@metamask/snaps-sdk';
import {
  DialogType,
  panel,
  text,
  type SnapsProvider,
} from '@metamask/snaps-sdk';

import type { SnapState } from '../types/snapState';
import { acquireLock } from './lock';

declare const snap: SnapsProvider;

/**
 * Retrieves the current SnapsProvider.
 *
 * @returns The current SnapsProvider.
 */
export function getProvider(): SnapsProvider {
  return snap;
}

/**
 * Retrieves a BIP44AddressKeyDeriver object.
 *
 * @returns A Promise that resolves to a BIP44AddressKeyDeriver object.
 */
export async function getBip44Deriver(): Promise<BIP44AddressKeyDeriver> {
  const bip44Node = await snap.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: 9004,
    },
  });
  return getBIP44AddressKeyDeriver(bip44Node);
}


/**
 * Displays a confirmation dialog with the specified interface id.
 *
 * @param interfaceId - A string representing the id of the interface.
 * @returns A Promise that resolves to the result of the dialog.
 */
export async function confirmDialogInteractiveUI(
  interfaceId: string,
): Promise<DialogResult> {
  return snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      id: interfaceId,
    },
  });
}

/**
 * Displays a confirmation dialog with the specified components.
 *
 * @param components - An array of components to display in the dialog.
 * @returns A Promise that resolves to the result of the dialog.
 */
export async function confirmDialog(
  components: Component[],
): Promise<DialogResult> {
  return snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: panel(components),
    },
  });
}

/**
 * Displays a alert dialog with the specified components.
 *
 * @param components - An array of components to display in the dialog.
 * @returns A Promise that resolves to the result of the dialog.
 */
export async function alertDialog(
  components: Component[],
): Promise<DialogResult> {
  return snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Alert,
      content: panel(components),
    },
  });
}

/**
 * Retrieves the current state data.
 *
 * @returns A Promise that resolves to the current state data.
 */
export async function getStateData<State>(): Promise<State> {
  return (await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'get',
    },
  })) as unknown as State;
}

/**
 * Sets the current state data to the specified data.
 *
 * @param data - The new state data to set.
 */
export async function setStateData<State>(data: State) {
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: data as unknown as Record<string, Json>,
    },
  });
}

export const updateRequiredMetaMaskComponent = () => {
  return panel([
    text(
      'You need to update your MetaMask to latest version to use this snap.',
    ),
  ]);
};

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
export const ensureJsxSupport = async (component: Component) => {
  try {
    const saveMutex = acquireLock();

    await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'alert',
        content: component,
      },
    });

    const state: SnapState = await getStateData<SnapState>();
    await saveMutex.runExclusive(async () => {
      state.requireMMUpgrade = false;
      await setStateData(state);
    });
  } catch {
    await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'alert',
        content: updateRequiredMetaMaskComponent(),
      },
    });
  }
};
