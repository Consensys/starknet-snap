import { AlertView } from './Alert.view';
import { Meta } from '@storybook/react';

export default {
  title: 'Atom/Alert',
  component: AlertView,
} as Meta;

export const AlertSuccess = () => <AlertView text="Success" variant="success" />;
export const AlertInfo = () => <AlertView text="Info" variant="info" />;
export const AlertError = () => <AlertView text="error" variant="error" />;
export const AlertDefault = () => <AlertView text="warning" variant="warning" />;
