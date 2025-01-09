import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Icon, Text, Heading, Copyable } from '@metamask/snaps-sdk/jsx';
import { getTranslator } from '../../utils/locale';

/**
 * Builds a UI component to confirm the action of revealing the private key.
 *
 * @returns A JSX component prompting the user to confirm revealing their private key.
 */
export const DisplayPrivateKeyDialogUI: SnapComponent = () => {
  const t = getTranslator();
  return (
    <Box>
      <Heading>Are you sure you want to reveal your private key?</Heading>
      <Box direction="horizontal">
        <Icon name="warning" size="md" />
        <Text>
          {t("confirmPrivateKeyAction")}
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
  const t = getTranslator();
  return (
    <Box>
      <Heading>{t("starknetPrivateKeyTitle")}</Heading>
      <Text>
        {t("starknetPrivateKeyDescription")}
      </Text>
      <Copyable value={privateKey} />
    </Box>
  );
};