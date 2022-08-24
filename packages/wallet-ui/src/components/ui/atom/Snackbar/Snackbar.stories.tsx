import { Meta } from '@storybook/react';
import { SnackbarView } from './Snackbar.view';

export default {
  title: 'Atom/Snackbar',
  component: SnackbarView,
} as Meta;

export const SnackbarSucces = () => <SnackbarView variant="success" text="Successfully" />;
export const SnackbarInfo = () => <SnackbarView variant="info" text="Unfortunately" />;
