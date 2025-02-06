import { Meta } from '@storybook/react';
import { AccountsHeaderView } from './AccountsHeader.view';
import { useState } from 'react';
import { Account } from 'types';

export default {
  title: 'Molecule/AccountsHeader',
  component: AccountsHeaderView,
} as Meta;

const accounts = [
  { address: '0x123', addressIndex: 0, visibility: false },
  { address: '0x456', addressIndex: 1, visibility: false },
];

export const Default = () => {
  const [showHiddenAccounts, setShowHiddenAccounts] = useState(false);

  return (
    <AccountsHeaderView
      showHiddenAccounts={showHiddenAccounts}
      setShowHiddenAccounts={setShowHiddenAccounts}
      hiddenAccounts={accounts as Account[]}
    />
  );
};
