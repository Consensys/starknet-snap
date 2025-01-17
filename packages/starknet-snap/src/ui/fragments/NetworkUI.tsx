import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Row, Text } from '@metamask/snaps-sdk/jsx';
import { getTranslator } from '../../utils/locale';

export type NetworkUIProps = {
  networkName: string;
};

/**
 * Build a row component with the network name.
 *
 * @param params - The parameters.
 * @param params.networkName - The network name.
 * @returns A row component with the network name.
 */
export const NetworkUI: SnapComponent<NetworkUIProps> = ({
  networkName,
}: NetworkUIProps) => {
  const translate = getTranslator();
  return (
  <Row label={translate("network")}>
    <Text>{networkName}</Text>
  </Row>
  )
};
