import { useMultiLanguage } from 'services';
import {
  AddressCopy,
  AddressQrCode,
  Title,
  Wrapper,
} from './ReceiveModal.style';

interface Props {
  address: string;
}

export const ReceiveModalView = ({ address }: Props) => {
  const { translate } = useMultiLanguage();

  return (
    <Wrapper>
      <Title>{translate('receive')}</Title>
      <AddressQrCode value={address} />
      <AddressCopy address={address} placement="top" />
    </Wrapper>
  );
};
