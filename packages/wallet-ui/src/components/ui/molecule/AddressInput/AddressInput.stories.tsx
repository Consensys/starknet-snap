import { Meta } from '@storybook/react';
import { AddressInputView } from './AddressInput.view';

export default {
  title: 'Molecule/AddressInput',
  component: AddressInputView,
} as Meta;

export const Default = () => <AddressInputView label="Address" />;

export const Disabled = () => <AddressInputView disabled label="Address" />;
