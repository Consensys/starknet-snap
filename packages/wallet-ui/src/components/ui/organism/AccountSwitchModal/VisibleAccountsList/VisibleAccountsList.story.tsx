import { Meta } from '@storybook/react';
import { VisibleAccountsListView } from './VisibleAccountsList.view';
import { Account } from 'types';

export default {
  title: 'Molecule/VisibleAccountsList',
  component: VisibleAccountsListView,
} as Meta;

const accounts = [
  { address: '0xabc', addressIndex: 1, visibility: true },
  { address: '0xdef', addressIndex: 2, visibility: true },
];

export const Default = () => (
  <VisibleAccountsListView
    accounts={accounts as Account[]}
    currentAddress="0xabc"
    onAccountSwitchClick={(account: Account) =>
      console.log(`Switch to ${account.address}`)
    }
    onAccountHiddenClick={(account: Account) =>
      console.log(`Hide account ${account.address}`)
    }
  />
);
