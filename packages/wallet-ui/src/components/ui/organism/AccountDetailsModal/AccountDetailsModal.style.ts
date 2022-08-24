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
`;

export const AccountImageStyled = styled(AccountImage)`
  margin: auto;
  border: 7px solid white;
  padding: 0px;
`;

export const TitleDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 24px;
`;

export const Title = styled.div`
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-weight: ${(props) => props.theme.typography.h3.fontSize};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  margin-right: 13px;
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
