import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Row, Text } from '@metamask/snaps-sdk/jsx';

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
}: NetworkUIProps) => (
  <Row label="Network">
    <Text>{networkName}</Text>
  </Row>
);
