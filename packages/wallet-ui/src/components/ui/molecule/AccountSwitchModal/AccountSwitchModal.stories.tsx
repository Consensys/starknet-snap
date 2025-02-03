import { Meta } from '@storybook/react';
import { AccountSwitchModalView } from './AccountSwitchModal.view';
import { Account } from 'types';

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

const accounts = [
  {
    address: '0x123...abcd',
    addressIndex: 0,
  },{
    address: '0x456...efgh',
    addressIndex: 1,
  },{
    address: '0x789...ijkl',
    addressIndex: 2,
  }, 
] as Account[];

export const Default = () => (
  <div style={wrapperStyle}>
    <AccountSwitchModalView
      currentAddress={address}
      accounts={accounts}
    ></AccountSwitchModalView>
  </div>
);

export const TooltipTop = () => (
  <div style={wrapperStyle}>
    <AccountSwitchModalView
      currentAddress={address}
      accounts={accounts}
    ></AccountSwitchModalView>
  </div>
);

export const Full = () => (
  <div style={wrapperStyle}>
    <AccountSwitchModalView
      currentAddress={address}
      accounts={accounts}
      full
    ></AccountSwitchModalView>
  </div>
);

export const DarkerBackground = () => (
  <div style={{ ...wrapperStyle, backgroundColor: 'grey' }}>
    <AccountSwitchModalView
      currentAddress={address}
      accounts={accounts}
      full
    ></AccountSwitchModalView>
  </div>
);
