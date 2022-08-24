import { Meta } from '@storybook/react';
import { AccountImageView } from './AccountImage.view';

export default {
  title: 'Atom/AccountImage',
  component: AccountImageView,
} as Meta;

const address = '0x683ec5da50476f84a5d47e822cd4dd35ae3a63c6c1f0725bf28526290d1ee13';

export const Default = () => <AccountImageView address={address} />;

export const Connected = () => <AccountImageView address={address} connected />;

export const Bigger = () => <AccountImageView address={address} size={60} connected />;
