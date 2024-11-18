import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Row, Text } from '@metamask/snaps-sdk/jsx';

export type RowUIProps = {
  label: string;
  value: string;
};

/**
 * Build a row component.
 *
 * @param params - The parameters.
 * @param params.label - The label of the row component.
 * @param params.value - The value of the row component.
 * @returns A row component.
 */
export const RowUI: SnapComponent<RowUIProps> = ({
  label,
  value,
}: RowUIProps) => (
  <Row label={label}>
    <Text>{value}</Text>
  </Row>
);
