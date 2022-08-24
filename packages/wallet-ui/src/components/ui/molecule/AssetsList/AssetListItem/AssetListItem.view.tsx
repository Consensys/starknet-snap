import { HTMLAttributes } from 'react';
import { getAssetIcon } from 'assets/types/assets';
import { Erc20TokenBalance } from 'types';
import { Column, Description, Label, Left, Middle, Right, Wrapper } from './AssetListItem.style';
import { DoubleIcons } from 'components/ui/atom/DoubleIcons';
import { getHumanReadableAmount } from 'utils/utils';

interface Props extends HTMLAttributes<HTMLDivElement> {
  asset: Erc20TokenBalance;
  selected?: boolean;
}

export const AssetListItemView = ({ asset, selected, ...otherProps }: Props) => {
  return (
    <Wrapper selected={selected} {...otherProps}>
      <Left>
        <DoubleIcons tokenName={asset.name} icon1={getAssetIcon(asset.name)} icon2={getAssetIcon('')} />
        <Column>
          <Label>{asset.name}</Label>
          <Description>
            {getHumanReadableAmount(asset)} {asset.symbol}
          </Description>
        </Column>
      </Left>

      <Middle></Middle>
      <Right></Right>
    </Wrapper>
  );
};
