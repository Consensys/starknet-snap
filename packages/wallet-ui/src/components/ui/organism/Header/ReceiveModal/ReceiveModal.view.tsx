import { useMultiLanguage } from 'services';
import { Modal } from 'components/ui/atom/Modal';
import { AddressCopy, AddressQrCode } from './ReceiveModal.style';

interface Props {
  address: string;
}

export const ReceiveModalView = ({ address }: Props) => {
  const { translate } = useMultiLanguage();

  return (
    <Modal>
      <Modal.Title>{translate('receive')}</Modal.Title>
      <Modal.Body>
        <AddressQrCode value={address} />
      </Modal.Body>
      <AddressCopy address={address} placement="top" />
    </Modal>
  );
};
