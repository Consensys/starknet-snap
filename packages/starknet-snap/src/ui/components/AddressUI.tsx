import type { SnapComponent } from '@metamask/snaps-sdk/jsx';

import { getExplorerUrl, shortenAddress } from '../../utils';
import { RowUI } from '../fragments';

export type AddressUIProps = {
  label: string;
  address: string;
  chainId?: string;
  shortern?: boolean;
};

/**
 * Build a row component with the address.
 *
 * @param params - The parameters.
 * @param params.label - The label.
 * @param params.address - The address.
 * @param [params.chainId] - The chain ID; if set, an explorer URL markdown will be generated.
 * @param [params.shortern] - Whether to shorten the address. Default is true.
 * @returns A row component with the address.
 */
export const AddressUI: SnapComponent<AddressUIProps> = ({
  label,
  address,
  chainId,
  shortern = true,
}: AddressUIProps) => {
  let value = address;

  if (shortern) {
    value = shortenAddress(address);
  }

  if (chainId) {
    value = `[${value}](${getExplorerUrl(address, chainId)})`;
  }

  return <RowUI label={label} value={value} />;
};
