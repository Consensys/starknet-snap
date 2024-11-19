import { Row, Text, type SnapComponent } from '@metamask/snaps-sdk/jsx';
import { formatUnits } from 'ethers/lib/utils';

export type AmountProps = {
  label: string;
  amount: string; // Bigint representatio
  decimals: number;
  symbol: string;
};
/**
 * Build a row component with the JSON data.
 *
 * @param params - The parameters.
 * @param params.label - The label.
 * @param params.amount
 * @param params.decimals
 * @param params.symbol
 * @returns A row component with the JSON data.
 */
export const Amount: SnapComponent<AmountProps> = ({
  label,
  amount,
  decimals,
  symbol,
}: AmountProps) => (
  <Row label={label}>
    <Text>{`${formatUnits(amount, decimals)} ${symbol}`}</Text>
  </Row>
);
