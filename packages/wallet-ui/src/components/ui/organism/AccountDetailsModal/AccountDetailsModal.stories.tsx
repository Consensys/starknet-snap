import { Meta } from '@storybook/react';
import { PopIn } from 'components/ui/molecule/PopIn';
import { useState } from 'react';
import { AccountDetailsModalView } from './AccountDetailsModal.view';

export default {
  title: 'Organism/AccountDetailsModal',
  component: AccountDetailsModalView,
} as Meta;

const address = '0x683ec5da50476f84a5d47e822cd4dd35ae3a63c6c1f0725bf28526290d1ee13';

export const ContentOnly = () => <AccountDetailsModalView address={address} />;

export const WithModal = () => {
  let [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen} showClose={false} style={{ backgroundColor: 'transparent' }}>
        <AccountDetailsModalView address={address} />
      </PopIn>
    </>
  );
};
