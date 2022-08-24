import { Meta } from '@storybook/react';
import { AssetQuantityView } from './AssetQuantity.view';

export default {
  title: 'Molecule/AssetQuantity',
  component: AssetQuantityView,
} as Meta;

export const Default = () => <AssetQuantityView currencyValue="0.02" USDValue="58.39" />;

export const Centered = () => <AssetQuantityView currencyValue="0.02" USDValue="58.39" centered />;

export const BigCentered = () => <AssetQuantityView currencyValue="0.02" USDValue="58.39" centered size="big" />;
