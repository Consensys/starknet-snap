import type { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import type { Component, DialogResult, Json } from '@metamask/snaps-sdk';
import { DialogType, panel, type SnapsProvider } from '@metamask/snaps-sdk';

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
export async function createInteractiveConfirmDialog(
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
