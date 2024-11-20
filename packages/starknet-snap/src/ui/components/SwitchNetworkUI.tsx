import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Heading, Copyable, Bold } from '@metamask/snaps-sdk/jsx';

import { NetworkUI } from '../fragments';

export type SwitchNetworkUIProps = {
  name: string;
  chainId: string;
};

/**
 * Builds a loading UI component.
 *
 * @param options0
 * @param options0.name
 * @param options0.chainId
 * @returns A loading component.
 */
export const SwitchNetworkUI: SnapComponent<SwitchNetworkUIProps> = ({
  name,
  chainId,
  // errors, // TODO: include this later
}) => {
  return (
    <Box>
      <Heading>Do you want to switch to this network?</Heading>
      <NetworkUI networkName={name} />
      <Box direction="horizontal" alignment="space-between">
        <Bold>Chain ID</Bold>
        <Copyable value={chainId} />
      </Box>
    </Box>
  );
};
