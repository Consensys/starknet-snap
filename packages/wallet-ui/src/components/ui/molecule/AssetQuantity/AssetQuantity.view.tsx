import { Currency, Dollars, Size, Wrapper } from './AssetQuantity.style';

interface Props {
  currency?: string;
  currencyValue: string;
  USDValue: string;
  centered?: boolean;
  size?: Size;
}

export const AssetQuantityView = ({ currency = 'ETH', currencyValue, USDValue, centered, size = 'normal' }: Props) => {
  return (
    <Wrapper centered={centered}>
      <Currency size={size}>
        {currencyValue} {currency}
      </Currency>
      {USDValue && <Dollars size={size}>{USDValue} USD</Dollars>}
    </Wrapper>
  );
};
