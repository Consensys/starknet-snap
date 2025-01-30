import { Meta } from '@storybook/react';
import { AccountSwitchModalView } from './AccountSwitchModal.view';

export default {
  title: 'Molecule/AccountAddress',
  component: AccountSwitchModalView,
} as Meta;

const address =
  '0x683ec5da50476f84a5d47e822cd4dd35ae3a63c6c1f0725bf28526290d1ee13';
const wrapperStyle = {
  backgroundColor: 'white',
  height: '300px',
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
};

export const Default = () => (
  <div style={wrapperStyle}>
    <AccountSwitchModalView currentAddress={address}></AccountSwitchModalView>
  </div>
);

export const Full = () => (
  <div style={wrapperStyle}>
    <AccountSwitchModalView
      currentAddress={address}
      full
    ></AccountSwitchModalView>
  </div>
);

export const DarkerBackground = () => (
  <div style={{ ...wrapperStyle, backgroundColor: 'grey' }}>
    <AccountSwitchModalView
      currentAddress={address}
      full
    ></AccountSwitchModalView>
  </div>
);
