import { Meta } from '@storybook/react';
import { DropDownView } from './DropDown.view';

export default {
  title: 'Molecule/DropDown',
  component: DropDownView,
} as Meta;

const options = ['LINK', 'ETHER', 'AAVE'];

const options2 = ['Account details', 'View on explorer'];

const label = 'Label';

export const Default = () => <DropDownView options={options2} label={label} />;

export const Error = () => <DropDownView error options={options} label={label} />;

export const Disabled = () => <DropDownView disabled options={options} label={label} />;

export const WithHelperText = () => <DropDownView error options={options} helperText="Helper text" label={label} />;
