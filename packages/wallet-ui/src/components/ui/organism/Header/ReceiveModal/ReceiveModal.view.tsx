import { useStarkNetSnap } from 'services';
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
  const { getTranslator } = useStarkNetSnap();
  const translate = getTranslator();

  return (
    translate && (
      <Wrapper>
        <Title>{translate('receive')}</Title>
        <AddressQrCode value={address} />
        <AddressCopy address={address} placement="top" />
      </Wrapper>
    )
  );
};
