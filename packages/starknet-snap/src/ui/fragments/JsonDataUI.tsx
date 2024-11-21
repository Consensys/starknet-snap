import { Row, Text, type SnapComponent } from '@metamask/snaps-sdk/jsx';

import { toJson } from '../../utils';

export type JsonDataUIProps = {
  label: string;
  data: any;
};
/**
 * Build a row component with the JSON data.
 *
 * @param params - The parameters.
 * @param params.data - The JSON data.
 * @param params.label - The label.
 * @returns A row component with the JSON data.
 */
export const JsonDataUI: SnapComponent<JsonDataUIProps> = ({
  label,
  data,
}: JsonDataUIProps) => (
  <Row label={label}>
    <Text>{toJson(data)}</Text>
  </Row>
);
