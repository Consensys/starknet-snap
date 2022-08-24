import { ReactNode } from 'react';
import { Label } from './Label.style';

interface Props {
  error?: boolean;
  children?: ReactNode;
}

export const LabelView = ({ error, children }: Props) => {
  return <Label error={error}>{children}</Label>;
};
