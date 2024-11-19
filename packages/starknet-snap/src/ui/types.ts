export type TokenTotals = Record<
  string,
  {
    amount: bigint; // Use BigInt for precise calculations
    decimals: number;
  }
>;
