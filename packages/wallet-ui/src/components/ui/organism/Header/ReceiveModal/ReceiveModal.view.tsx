import { AddressCopy, AddressQrCode, Title, Wrapper } from './ReceiveModal.style';

interface Props {
  address: string;
}

export const ReceiveModalView = ({ address }: Props) => {
  return (
    <Wrapper>
      <Title>Receive</Title>
      <AddressQrCode value={address} />
      <AddressCopy address={address} placement="top" />
    </Wrapper>
  );
};
