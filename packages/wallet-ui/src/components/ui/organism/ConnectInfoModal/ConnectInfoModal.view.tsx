import { useAppDispatch, useAppSelector } from 'hooks/redux';

import { setInfoModalVisible } from 'slices/modalSlice';
import { useMultiLanguage } from 'services';
import { Alert } from 'components/ui/atom/Alert';
import { Button } from 'components/ui/atom/Button';
import { Modal } from 'components/ui/atom/Modal';
import { Bold, Normal } from './ConnectInfoModal.style';

interface Props {
  address: string;
  onButtonClick?: () => void;
}

export const ConnectInfoModalView = ({ address, onButtonClick }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const dispatch = useAppDispatch();
  const { translate } = useMultiLanguage();

  return (
    <Modal>
      <Modal.Body align="left">
        <p>
          <Normal>{translate('network')}</Normal>
          <Bold>{networks.items[networks.activeNetwork]?.name}</Bold>
        </p>
        <p>
          <Normal>{translate('starknetAccount')}</Normal>
          <Bold>{address}</Bold>
        </p>
        <Alert
          variant="info"
          text={translate('accountGeneratedWithRecoveryPhrase')}
        />
      </Modal.Body>
      <Button
        onClick={() => {
          dispatch(setInfoModalVisible(false));
          onButtonClick && onButtonClick();
        }}
      >
        {translate('gotIt')}
      </Button>
    </Modal>
  );
};
