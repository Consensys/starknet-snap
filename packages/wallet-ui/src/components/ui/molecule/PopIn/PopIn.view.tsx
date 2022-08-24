import React, { HTMLAttributes, MutableRefObject, ReactNode } from 'react';
import { Dialog } from '@headlessui/react';
import { Wrapper, CloseButton, Panel } from './PopIn.style';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Backdrop } from 'components/ui/atom/Backdrop';

interface Props extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  showClose?: boolean;
  initialFocus?: MutableRefObject<HTMLElement | null> | undefined;
  children?: ReactNode;
}

export const PopInView = ({ isOpen, setIsOpen, showClose = true, initialFocus, children, ...otherProps }: Props) => {
  return (
    <Dialog
      style={{ position: 'relative', zIndex: 50 }}
      open={isOpen}
      onClose={() => setIsOpen && setIsOpen(false)}
      initialFocus={initialFocus}
    >
      <Backdrop aria-hidden="true" />
      <Wrapper>
        <Panel {...otherProps}>
          <CloseButton
            className="modal-close-button"
            style={{ display: showClose ? 'inline-block' : 'none' }}
            onClick={() => setIsOpen && setIsOpen(false)}
          >
            <FontAwesomeIcon icon="xmark" />
          </CloseButton>
          {children}
        </Panel>
      </Wrapper>
    </Dialog>
  );
};
