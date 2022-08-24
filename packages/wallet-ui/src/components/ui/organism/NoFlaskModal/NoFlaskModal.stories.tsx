import { Meta } from '@storybook/react';
import { useState } from 'react';
import { PopIn } from 'components/ui/molecule/PopIn';
import { NoFlaskModalView } from './NoFlaskModal.view';

export default {
  title: 'Organism/NoFlaskModal',
  component: NoFlaskModalView,
} as Meta;

export const ContentOnly = () => <NoFlaskModalView />;

export const WithModal = () => {
  let [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen} showClose={false}>
        <NoFlaskModalView></NoFlaskModalView>
      </PopIn>
    </>
  );
};
