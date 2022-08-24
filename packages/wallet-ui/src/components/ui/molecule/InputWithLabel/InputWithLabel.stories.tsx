import { Meta } from '@storybook/react';
import { InputWithLabelView } from './InputWithLabel.view';

export default {
  title: 'Molecule/InputWithLabel',
  component: InputWithLabelView,
} as Meta;

export const Default = () => <InputWithLabelView placeholder="Placeholder" label="Label" />;

export const Error = () => <InputWithLabelView error placeholder="Placeholder" label="Label" />;

export const Disabled = () => <InputWithLabelView disabled placeholder="Placeholder" label="Label" />;

export const WithHelperText = () => (
  <InputWithLabelView error placeholder="Placeholder" helperText="Helper text" label="Label" />
);

export const WithIcon = () => <InputWithLabelView placeholder="Placeholder" label="Label" withIcon />;

export const WithIconError = () => <InputWithLabelView error placeholder="Placeholder" label="Label" withIcon />;
