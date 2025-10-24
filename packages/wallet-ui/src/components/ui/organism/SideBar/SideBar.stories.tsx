import { Meta } from '@storybook/react';
import { SideBarView } from './SideBar.view';

export default {
  title: 'Organism/SideBar',
  component: SideBarView,
} as Meta;

export const Default = () => {
  return (
    <div style={{ width: '33%' }}>
      <SideBarView />
    </div>
  );
};
