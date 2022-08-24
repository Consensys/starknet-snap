import React, { ReactNode } from 'react';
import { Wrapper } from './LoadingBackdrop.style';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Backdrop } from 'components/ui/atom/Backdrop';

interface Props {
  children?: ReactNode;
}

export const LoadingBackdropView = ({ children }: Props) => {
  return (
    <>
      <Backdrop />
      <Wrapper>
        <FontAwesomeIcon icon="spinner" pulse />
        <h3>{children}</h3>
      </Wrapper>
    </>
  );
};
