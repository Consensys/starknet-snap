import { Meta } from '@storybook/react';
import { HiddenAccountsListView } from './HiddenAccountsList.view';
import { Account } from 'types';

export default {
  title: 'Molecule/HiddenAccountsList',
  component: HiddenAccountsListView,
} as Meta;

const accounts = [
  { address: '0x123', addressIndex: 0, visibility: false },
  { address: '0x456', addressIndex: 1, visibility: false },
];

export const Default = () => {
  return (
    <HiddenAccountsListView
      accounts={accounts as Account[]}
      onAccountVisibleClick={(account: Account) =>
        console.log(`Show account ${account.address}`)
      }
    />
  );
};
