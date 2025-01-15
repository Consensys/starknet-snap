import { Meta } from '@storybook/react';
import { AccountSwitchAddressView } from './AccountSwitchAddress.view';

export default {
  title: 'Molecule/AccountAddress',
  component: AccountSwitchAddressView,
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

const accounts = ['0x123...abcd', '0x456...efgh', '0x789...ijkl'];

export const Default = () => (
  <div style={wrapperStyle}>
    <AccountSwitchAddressView
      address={address}
      accounts={accounts}
    ></AccountSwitchAddressView>
  </div>
);

export const TooltipTop = () => (
  <div style={wrapperStyle}>
    <AccountSwitchAddressView
      address={address}
      accounts={accounts}
    ></AccountSwitchAddressView>
  </div>
);

export const Full = () => (
  <div style={wrapperStyle}>
    <AccountSwitchAddressView
      address={address}
      accounts={accounts}
      full
    ></AccountSwitchAddressView>
  </div>
);

export const DarkerBackground = () => (
  <div style={{ ...wrapperStyle, backgroundColor: 'grey' }}>
    <AccountSwitchAddressView
      address={address}
      accounts={accounts}
      full
    ></AccountSwitchAddressView>
  </div>
);
