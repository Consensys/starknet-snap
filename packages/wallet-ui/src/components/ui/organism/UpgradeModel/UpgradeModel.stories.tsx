import { Meta } from '@storybook/react';
import { useState } from 'react';
import { PopIn } from 'components/ui/molecule/PopIn';
import { UpgradeModelView } from './UpgradeModel.view';

export default {
  title: 'Organism/UpgradeModel',
  component: UpgradeModelView,
} as Meta;

export const ContentOnly = () => <UpgradeModelView address="xxxxxx" />;

export const WithModal = () => {
  let [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Open Modal</button>
      <PopIn isOpen={isOpen} setIsOpen={setIsOpen} showClose={false}>
        <UpgradeModelView address="xxxxxx"></UpgradeModelView>
      </PopIn>
    </>
  );
};
