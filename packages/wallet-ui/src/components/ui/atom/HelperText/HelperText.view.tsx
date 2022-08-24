import { ReactNode } from 'react';
import { HelperText } from './HelperText.style';

interface Props {
  children?: ReactNode;
}

export const HelperTextView = ({ children }: Props) => {
  return <HelperText>{children}</HelperText>;
};
