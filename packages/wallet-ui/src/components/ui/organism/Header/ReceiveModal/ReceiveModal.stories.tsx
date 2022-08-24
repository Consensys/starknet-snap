import { Meta } from '@storybook/react';
import { useState } from 'react';
import { PopIn } from 'components/ui/molecule/PopIn';
import { ReceiveModalView } from './ReceiveModal.view';

export default {
  title: 'Organism/Header/ReceiveModal',
  component: ReceiveModalView,
} as Meta;

const address = '0x683ec5da50476f84a5d47e822cd4dd35ae3a63c6c1f0725bf28526290d1ee13';

export const ContentOnly = () => <ReceiveModalView address={address} />;

export const Modal = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen}>
        <ReceiveModalView address={address} />
      </PopIn>
    </>
  );
};
