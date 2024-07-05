import { Meta } from '@storybook/react';
import { useState } from 'react';
import { PopIn } from 'components/ui/molecule/PopIn';
import { DeployModalView } from './DeployModal.view';

export default {
  title: 'Organism/DeployModal',
  component: DeployModalView,
} as Meta;

export const ContentOnly = () => <DeployModalView address="xxxxxx" />;

export const WithModal = () => {
  let [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen} showClose={false}>
        <DeployModalView address="xxxxxx"></DeployModalView>
      </PopIn>
    </>
  );
};
