import styled from 'styled-components';
import QRCode from 'react-qr-code';

import { AccountAddress } from 'components/ui/molecule/AccountAddress';

export const AddressQrCode = styled(QRCode).attrs(() => ({
  size: 134,
}))``;

export const AddressCopy = styled(AccountAddress)``;
