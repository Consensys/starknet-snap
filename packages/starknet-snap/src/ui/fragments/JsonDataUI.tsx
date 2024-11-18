import type { SnapComponent } from '@metamask/snaps-sdk/jsx';

import { toJson } from '../../utils';
import { RowUI } from './RowUI';

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
}: JsonDataUIProps) => <RowUI label={label} value={toJson(data)} />;
