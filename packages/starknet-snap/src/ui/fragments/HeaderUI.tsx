import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Button, Heading, Icon } from '@metamask/snaps-sdk/jsx';

export type HeaderUIProps = {
  title: string;
};

/**
 * Build a HeaderUI component.
 *
 * @param params - The parameters.
 * @param params.title
 * @returns A row component.
 */
export const HeaderUI: SnapComponent<HeaderUIProps> = ({
  title,
}: HeaderUIProps) => (
  <Box direction="horizontal" alignment="space-between" center>
    <Button name="back">
      <Icon name="arrow-left" color="primary" size="md" />
    </Button>
    <Heading>{title}</Heading>
    <Button name="menu">
      <Icon name="more-vertical" color="primary" size="md" />
    </Button>
  </Box>
);
