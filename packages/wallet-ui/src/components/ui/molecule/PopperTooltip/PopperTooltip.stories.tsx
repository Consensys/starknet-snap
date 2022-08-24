import { Meta } from '@storybook/react';
import { PopperTooltipView } from './PopperTooltip.view';

export default {
  title: 'Molecule/PopperTooltip',
  component: PopperTooltipView,
} as Meta;

const messageExample = 'Tooltip message';

export const Default = () => (
  <PopperTooltipView content={messageExample}>
    <button>Click Me!</button>
  </PopperTooltipView>
);

export const CloseOnClickOutside = () => (
  <PopperTooltipView content={messageExample} closeTrigger="click">
    <button>Click Me!</button>
  </PopperTooltipView>
);
