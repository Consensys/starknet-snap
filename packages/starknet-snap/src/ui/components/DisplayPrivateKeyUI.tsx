import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Icon, Text, Heading, Copyable } from '@metamask/snaps-sdk/jsx';

/**
 * Builds a loading UI component.
 *
 * @returns A loading component.
 */
export const DisplayPrivateKeyDialogUI: SnapComponent = () => {
  return (
    <Box>
      <Heading>Are you sure you want to reveal your private key?</Heading>
      <Box direction="horizontal">
        <Icon name="warning" size="md" />
        <Text>
          Confirming this action will display your private key. Ensure you are
          in a secure environment.
        </Text>
      </Box>
    </Box>
  );
};

export type DisplayPrivateKeyAlertUIProps = {
  privateKey: string;
};

/**
 * Builds a loading UI component.
 *
 * @param options0
 * @param options0.privateKey
 * @returns A loading component.
 */
export const DisplayPrivateKeyAlertUI: SnapComponent<
  DisplayPrivateKeyAlertUIProps
> = ({
  privateKey,
  // errors, // TODO: include this later
}) => {
  return (
    <Box>
      <Heading>Starknet Account Private Key</Heading>
      <Text>
        Below is your Starknet Account private key. Keep it confidential.
      </Text>
      <Copyable value={privateKey} />
    </Box>
  );
};
