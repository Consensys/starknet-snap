import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Heading, Copyable, Bold } from '@metamask/snaps-sdk/jsx';

import { NetworkUI } from '../fragments';

export type SwitchNetworkUIProps = {
  name: string;
  chainId: string;
};

/**
 * Builds a UI component for confirming a network switch.
 *
 * @param options - The options to configure the component.
 * @param options.name - The name of the blockchain network to switch to.
 * @param options.chainId - The chain ID of the target blockchain network.
 * @returns A JSX component for the user to confirm the network switch.
 */
export const SwitchNetworkUI: SnapComponent<SwitchNetworkUIProps> = ({
  name,
  chainId,
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
