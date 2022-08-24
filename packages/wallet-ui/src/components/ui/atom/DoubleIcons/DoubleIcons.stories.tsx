import { Meta } from '@storybook/react';
import { DoubleIconsView } from './DoubleIcons.view';
import ethIcon from 'assets/images/eth-icon.svg';
import starknetIcon from 'assets/images/starknet-icon.svg';

export default {
  title: 'Atom/DoubleIcons',
  component: DoubleIconsView,
} as Meta;

export const Default = () => <DoubleIconsView icon1={ethIcon} icon2={starknetIcon} />;

export const Bigger = () => (
  <DoubleIconsView icon1={ethIcon} icon2={starknetIcon} iconSize="48px" cornerIconSize="24px" />
);
