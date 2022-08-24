import { Meta } from '@storybook/react';
import { MenuView } from './Menu.view';

export default {
  title: 'Organism/Menu',
  component: MenuView,
} as Meta;

export const Default = () => <MenuView connected={true} />;

export const Disconnected = () => <MenuView connected={false} />;
