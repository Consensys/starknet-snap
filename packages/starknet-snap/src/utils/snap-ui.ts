import { divider, heading, row, text } from '@metamask/snaps-sdk';

import { getExplorerUrl } from './explorer';
import { toJson } from './serializer';
import { shortenAddress } from './string';

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
