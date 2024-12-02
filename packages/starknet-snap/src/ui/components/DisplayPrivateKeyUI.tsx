import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Icon, Text, Heading, Copyable } from '@metamask/snaps-sdk/jsx';

/**
 * Builds a UI component to confirm the action of revealing the private key.
 *
 * @returns A JSX component prompting the user to confirm revealing their private key.
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
 * Builds a UI component to display the private key securely.
 *
 * @param options - The options to configure the component.
 * @param options.privateKey - The private key to be displayed.
 * @returns A JSX component for securely displaying the private key with a copyable option.
 */
export const DisplayPrivateKeyAlertUI: SnapComponent<
  DisplayPrivateKeyAlertUIProps
> = ({ privateKey }) => {
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
