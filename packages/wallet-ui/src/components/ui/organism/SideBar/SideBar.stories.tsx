import { Meta } from '@storybook/react';
import { SideBarView } from './SideBar.view';

export default {
  title: 'Organism/SideBar',
  component: SideBarView,
} as Meta;

const address = '0x683ec5da50476f84a5d47e822cd4dd35ae3a63c6c1f0725bf28526290d1ee13';

export const Default = () => {
  return (
    <div style={{ width: '33%' }}>
      <SideBarView address={address} />
    </div>
  );
};
