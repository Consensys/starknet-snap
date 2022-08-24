import { Meta } from '@storybook/react';
import { AddTokenModalView } from './AddTokenModal.view';

export default {
  title: 'Organism/AddTokenModal',
  component: AddTokenModalView,
} as Meta;

export const Default = () => <AddTokenModalView closeModal={() => {}} />;
