import { Meta } from '@storybook/react';
import { PopIn } from 'components/ui/molecule/PopIn';
import { useState } from 'react';
import { AccountDetailsModalView } from './AccountDetailsModal.view';

export default {
  title: 'Organism/AccountDetailsModal',
  component: AccountDetailsModalView,
} as Meta;

export const ContentOnly = () => <AccountDetailsModalView />;

export const WithModal = () => {
  let [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        showClose={false}
        style={{ backgroundColor: 'transparent' }}
      >
        <AccountDetailsModalView />
      </PopIn>
    </>
  );
};
