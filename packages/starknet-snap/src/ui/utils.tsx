import { DialogType } from '@metamask/snaps-sdk';

/**
 *
 * @param options0
 * @param options0.children
 */
export async function alertDialog({ children }) {
  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Alert,
      content: children,
    },
  });
}

/**
 *
 * @param options0
 * @param options0.children
 */
export async function confirmDialog({ children }) {
  return await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content: children,
    },
  });
}
