import { Meta } from '@storybook/react';
import { useState } from 'react';
import { PopIn } from 'components/ui/molecule/PopIn';
import { MinVersionModalView } from './MinVersionModal.view';

export default {
  title: 'Organism/MinVersionModal',
  component: MinVersionModalView,
} as Meta;

export const ContentOnly = () => <MinVersionModalView />;

export const WithModal = () => {
  let [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen} showClose={false}>
        <MinVersionModalView></MinVersionModalView>
      </PopIn>
    </>
  );
};
