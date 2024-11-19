import type { SnapComponent } from '@metamask/snaps-sdk/jsx';

import { RowUI } from '../fragments';

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
}: NetworkUIProps) => <RowUI label="Network" value={networkName} />;
