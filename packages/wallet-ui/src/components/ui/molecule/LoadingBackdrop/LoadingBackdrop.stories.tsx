import { Meta } from '@storybook/react';
import { LoadingBackdrop } from './index';

export default {
  title: 'Molecule/LoadingBackdrop',
  component: LoadingBackdrop,
} as Meta;

export const Default = () => {
  return <LoadingBackdrop>Deploying account...</LoadingBackdrop>;
};
