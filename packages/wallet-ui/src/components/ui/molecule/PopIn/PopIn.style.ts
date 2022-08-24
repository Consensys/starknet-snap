import styled from 'styled-components';
import { Dialog } from '@headlessui/react';

export const Wrapper = styled.div`
  display: flex;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 1rem;
  justify-content: center;
  align-items: center;
`;

export const CloseButton = styled.button`
  color: ${(props) => props.theme.palette.grey.grey1};
  position: absolute;
  right: 16px;
  top: 16px;
  font-size: 14px;
  font-weight: 900;
  border: none;
  background-color: Transparent;
  width: 24px;
  height: 24px;
  :focus {
    outline: none;
  }
`;

export const Panel = styled(Dialog.Panel)`
  display: flex;
  position: relative;
  flex-direction: column;
  align-items: center;
  width: 376px;
  box-shadow: 0px 14px 24px -6px rgba(106, 115, 125, 0.2);
  border-radius: 8px;
  background-color: ${(props) => props.theme.palette.grey.white};
`;
