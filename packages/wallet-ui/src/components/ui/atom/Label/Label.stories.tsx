import { Meta } from '@storybook/react';
import { LabelView } from './Label.view';

export default {
  title: 'Atom/Label',
  component: LabelView,
} as Meta;

export const Default = () => <LabelView>Label</LabelView>;

export const Error = () => <LabelView error>Label</LabelView>;
