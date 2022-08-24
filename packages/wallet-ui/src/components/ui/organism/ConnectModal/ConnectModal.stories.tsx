import { Meta } from '@storybook/react';
import { useState } from 'react';
import { PopIn } from 'components/ui/molecule/PopIn';
import { ConnectModalView } from './ConnectModal.view';

export default {
  title: 'Organism/ConnectModal',
  component: ConnectModalView,
} as Meta;

export const ContentOnly = () => <ConnectModalView />;

export const WithModal = () => {
  let [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen} showClose={false}>
        <ConnectModalView></ConnectModalView>
      </PopIn>
    </>
  );
};
