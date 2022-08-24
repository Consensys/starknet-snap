import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meta } from '@storybook/react';
import { RoundedIconView } from './RoundedIcon.view';

export default {
  title: 'Atom/RoundedIcon',
  component: RoundedIconView,
} as Meta;

export const Default = () => <RoundedIconView>i</RoundedIconView>;

export const WithIcon = () => (
  <RoundedIconView>
    <FontAwesomeIcon icon={['fas', 'plus']} />
  </RoundedIconView>
);
