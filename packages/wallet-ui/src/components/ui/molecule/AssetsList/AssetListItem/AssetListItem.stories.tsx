import { Meta } from '@storybook/react';
import { BigNumber } from 'ethers';
import { constants } from 'starknet';
import { Erc20TokenBalance } from 'types';
import { AssetListItemView } from './AssetListItem.view';

export default {
  title: 'Molecule/AssetListItem',
  component: AssetListItemView,
} as Meta;

const asset: Erc20TokenBalance = {
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  amount: BigNumber.from('1000000000000000000'),
  chainId: constants.StarknetChainId.TESTNET,
  decimals: 18,
  name: 'Ether',
  symbol: 'ETH',
  usdPrice: 1000,
};

export const FullWidth = () => <AssetListItemView asset={asset} />;

export const SmallWidth = () => {
  return (
    <div style={{ width: '30%' }}>
      <AssetListItemView asset={asset} />
    </div>
  );
};
