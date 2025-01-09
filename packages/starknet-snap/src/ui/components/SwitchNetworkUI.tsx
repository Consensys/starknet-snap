import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Heading, Copyable, Bold } from '@metamask/snaps-sdk/jsx';

import { getTranslator } from '../../utils/locale';
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
  const translate = getTranslator();
  return (
    <Box>
      <Heading>{translate('switchNetworkPrompt')}</Heading>
      <NetworkUI networkName={name} />
      <Box direction="horizontal" alignment="space-between">
        <Bold>{translate('chainIdLabel')}</Bold>
        <Copyable value={chainId} />
      </Box>
    </Box>
  );
};
