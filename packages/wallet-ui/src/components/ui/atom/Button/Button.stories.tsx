import { Meta } from '@storybook/react';
import { ButtonView } from './Button.view';

export default {
  title: 'Atom/Button',
  component: ButtonView,
} as Meta;

export const Default = () => <ButtonView>Default Button</ButtonView>;

export const Success = () => <ButtonView variant="success">Success Button</ButtonView>;

export const Warning = () => <ButtonView variant="warning">Warning Button</ButtonView>;

export const Error = () => <ButtonView variant="error">Error Button</ButtonView>;

export const Info = () => <ButtonView variant="info">Info Button</ButtonView>;

export const Disabled = () => <ButtonView enabled={false}>Info Button</ButtonView>;

export const ActionClick = () => <ButtonView onClick={() => alert('Clicked!')}>Action Button</ButtonView>;

export const WithIconNoBackground = () => (
  <ButtonView iconLeft="circle-plus" backgroundTransparent>
    With Icon No Background
  </ButtonView>
);
