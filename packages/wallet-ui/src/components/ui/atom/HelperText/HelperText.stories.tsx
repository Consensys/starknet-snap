import { Meta } from '@storybook/react';
import { HelperTextView } from './HelperText.view';

export default {
  title: 'Atom/HelperText',
  component: HelperTextView,
} as Meta;

export const Default = () => <HelperTextView>Helper text</HelperTextView>;
