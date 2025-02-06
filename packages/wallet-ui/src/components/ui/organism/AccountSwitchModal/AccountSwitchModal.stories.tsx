import { Meta } from '@storybook/react';
import { AccountSwitchModalView } from './AccountSwitchModal.view';

export default {
  title: 'Molecule/AccountAddress',
  component: AccountSwitchModalView,
} as Meta;

const wrapperStyle = {
  backgroundColor: 'white',
  height: '300px',
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
};

export const Default = () => (
  <div style={wrapperStyle}>
    <AccountSwitchModalView></AccountSwitchModalView>
  </div>
);

export const Full = () => (
  <div style={wrapperStyle}>
    <AccountSwitchModalView full></AccountSwitchModalView>
  </div>
);

export const DarkerBackground = () => (
  <div style={{ ...wrapperStyle, backgroundColor: 'grey' }}>
    <AccountSwitchModalView full></AccountSwitchModalView>
  </div>
);
