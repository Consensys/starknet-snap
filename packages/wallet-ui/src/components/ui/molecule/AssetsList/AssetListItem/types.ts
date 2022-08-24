import { IconName } from '@fortawesome/fontawesome-svg-core';

export interface INameIcon {
  Send: IconName;
  Receive: IconName;
}

export const NameIcon: INameIcon = {
  Send: 'arrow-up',
  Receive: 'arrow-down',
};
