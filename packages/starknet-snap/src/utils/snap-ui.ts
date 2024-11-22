import type { Component } from '@metamask/snaps-sdk';
import { divider, heading, panel, row, text } from '@metamask/snaps-sdk';

import { getExplorerUrl } from './explorer';
import { toJson } from './serializer';
import { shortenAddress } from './string';

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
export const ensureJsxSupport = async (component: Component): Promise<void> => {
  try {
    // Try rendering the JSX component to test compatibility
    await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'alert',
        content: component,
      },
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

/**
 * Build a row component.
 *
 * @param params - The parameters.
 * @param params.label - The label of the row component.
 * @param params.value - The value of the row component.
 * @returns A row component.
 */
export function rowUI({ label, value }: { label: string; value: string }) {
  return row(
    label,
    text({
      value,
      markdown: false,
    }),
  );
}

/**
 * Build a row component with the address.
 *
 * @param params - The parameters.
 * @param params.label - The label.
 * @param params.address - The address.
 * @param [params.chainId] - The chain ID, when the chain ID is set, a exploder URL markdown will be generated.
 * @param [params.shortern] - Whether to shorten the address. Default is true.
 * @returns A row component with the address.
 */
export function addressUI({
  label,
  address,
  chainId,
  shortern = true,
}: {
  label: string;
  address: string;
  chainId?: string;
  shortern?: boolean;
}) {
  let value = address;

  if (shortern) {
    value = shortenAddress(address);
  }

  if (chainId) {
    value = `[${value}](${getExplorerUrl(address, chainId)})`;
  }
  return rowUI({
    label,
    value,
  });
}

/**
 * Build a row component with the network name.
 *
 * @param params - The parameters.
 * @param params.networkName - The network name.
 * @returns A row component with the network name.
 */
export function networkUI({ networkName }: { networkName: string }) {
  return rowUI({
    label: 'Network',
    value: networkName,
  });
}

/**
 * Build a heading component.
 *
 * @param value - The header.
 * @returns A heading component.
 */
export function headerUI(value: string) {
  return heading(value);
}

/**
 * Build a divider component
 *
 * @returns A divider component.
 */
export function dividerUI() {
  return divider();
}

/**
 * Build a row component with the signer address.
 *
 * @param params - The parameters.
 * @param params.address - The signer address.
 * @param params.chainId - The chain ID.
 * @returns A row component with the signer address.
 */
export function signerUI({
  address,
  chainId,
}: {
  address: string;
  chainId: string;
}) {
  return addressUI({
    label: 'Signer Address',
    address,
    chainId,
    shortern: true,
  });
}

/**
 * Build a row component with the JSON data.
 *
 * @param params - The parameters.
 * @param params.data - The JSON data.
 * @param params.label - The label.
 * @returns A row component with the JSON data.
 */
export function jsonDataUI({ data, label }: { data: any; label: string }) {
  return rowUI({
    label,
    value: toJson(data),
  });
}
