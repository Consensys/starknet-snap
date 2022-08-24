import { HTMLAttributes, ReactNode } from 'react';
import { Wrapper } from './RoundedIcon.style';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const RoundedIconView = ({ children, ...otherProps }: Props) => {
  return <Wrapper {...otherProps}>{children}</Wrapper>;
};
