import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import QRCode from 'react-qr-code';
import styled from 'styled-components';
import { AccountImage } from 'components/ui/atom/AccountImage';
import { Button } from 'components/ui/atom/Button';
import { AccountAddress } from 'components/ui/molecule/AccountAddress';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.palette.grey.white};
  width: ${(props) => props.theme.modal.noPadding};
  border-radius: 8px 8px 0px 0px;
  margin-top: -32px;
  padding-top: 56px;
  padding-bottom: 24px;
  align-items: center;
`;

export const AccountImageDiv = styled.div`
  width: ${(props) => props.theme.modal.noPadding};
  background-color: transparent;
  padding-left: 12px;
`;

export const AccountImageStyled = styled(AccountImage)`
  margin: auto;
  border: 7px solid white;
  padding: 0px;
`;

export const TitleDiv = styled.div`
  margin-bottom: 25px;
`;

export const RowDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

export const ErrorMsg = styled.div`
  text-align: center;
  color: ${(props) => props.theme.palette.error.main};
  font-size: ${(props) => props.theme.typography.c1.fontSize};
  font-weight: ${(props) => props.theme.typography.c1.fontSize};
  font-family: ${(props) => props.theme.typography.c1.fontFamily};
`;

export const Title = styled.div`
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-weight: ${(props) => props.theme.typography.h3.fontSize};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  word-break: break-word;
  max-width: 200px;
  text-align: left;
  line-height: 1.4;
`;

export const ModifyIcon = styled(FontAwesomeIcon).attrs((props) => ({
  color: props.theme.palette.grey.grey1,
  icon: 'pen',
}))`
  cursor: pointer;
`;

export const AddressQrCode = styled(QRCode).attrs(() => ({
  size: 134,
}))`
  margin-bottom: 24px;
`;

export const AddressCopy = styled(AccountAddress)``;

export const ButtonDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  width: ${(props) => props.theme.modal.base};
  background-color: ${(props) => props.theme.palette.grey.white};
  border-radius: 0px 0px 8px 8px;
  gap: 16px;
  box-shadow: inset 0px 1px 0px rgba(212, 212, 225, 0.4);
`;

export const ButtonStyled = styled(Button).attrs(() => ({
  backgroundTransparent: true,
  borderVisible: true,
}))`
  width: 240px;
`;

export const EditIcon = styled.button`
  background: none;
  border: none;
  margin-left: 8px;
  cursor: pointer;
  color: #888;
  font-size: 14px;
  transition: color 0.2s;

  &:hover {
    color: #000;
  }
`;

export const IconButton = styled.button<{ disabled: boolean }>`
  background-color: transparent;
  border: none;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  border: none;
  margin-left: 6px;
  font-size: 14px;
  color: #333;
  transition: color 0.2s;

  &:hover {
    color: #000;
  }
`;

export const AccountNameInput = styled.input`
  font-size: 23px;
  font-weight: bold;
  padding: 4px 8px;
  margin-left: 7px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  width: 200px;
  text-align: center;
  transition: border-color 0.2s;

  &:focus {
    border-color: #007bff;
  }
`;
