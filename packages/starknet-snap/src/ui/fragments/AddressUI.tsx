import {
  Link,
  Row,
  Text,
  Image,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import { getExplorerUrl, shortenAddress } from '../../utils';

export type AddressUIProps = {
  label: string;
  address: string;
  chainId?: string;
  shortern?: boolean;
  svgIcon?: string;
};

/**
 * Builds a row component with the address, displaying an icon if provided, otherwise showing the address as text or a link.
 * If both `svgIcon` and `chainId` are provided, the icon is wrapped in a link.
 *
 * @param params - The parameters.
 * @param params.label - The label.
 * @param params.address - The address.
 * @param [params.chainId] - The chain ID; if set, an explorer URL link will be generated.
 * @param [params.shortern] - Whether to shorten the address. Default is true.
 * @param [params.svgIcon] - An optional SVG icon to display instead of the address text.
 * @returns A row component with the address or icon.
 */
export const AddressUI: SnapComponent<AddressUIProps> = ({
  label,
  address,
  chainId,
  svgIcon,
  shortern = true,
}: AddressUIProps) => {
  const displayValue = shortern ? shortenAddress(address) : address;
  const explorerUrl = chainId ? getExplorerUrl(address, chainId) : null;
  let content;
  if (svgIcon) {
    content = <Image src={svgIcon} />;
  } else if (explorerUrl) {
    content = <Link href={explorerUrl}>{displayValue}</Link>;
  } else {
    content = <Text>{displayValue}</Text>;
  }

  return <Row label={label}>{content}</Row>;
};
