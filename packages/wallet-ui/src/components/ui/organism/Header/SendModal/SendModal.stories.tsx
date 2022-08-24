import { Meta } from '@storybook/react';
import { useState } from 'react';
import { PopIn } from 'components/ui/molecule/PopIn';
import { SendModalView } from './SendModal.view';

export default {
  title: 'Organism/Header/SendModal',
  component: SendModalView,
} as Meta;

export const ContentOnly = () => <SendModalView />;

export const WithModal = () => {
  let [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen}>
        <SendModalView closeModal={() => setIsOpen(false)}></SendModalView>
      </PopIn>
    </>
  );
};
