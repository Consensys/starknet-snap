import { Modal } from 'components/ui/atom/Modal';
import { useMultiLanguage } from 'services';

export const ForceUpgadeModalView = () => {
  const { translate } = useMultiLanguage();

  return (
    <Modal>
      <Modal.Logo />
      <Modal.Title>{translate('newVersionAvailable')}</Modal.Title>
      <Modal.Body align="left">
        {translate('installLatestVersion')}
        <ul>
          <li>{translate('deleteCurrentVersionMetaMask')}</li>
          <li>{translate('refreshPage')}</li>
          <li>{translate('connectToMetaMask')}</li>
        </ul>
        {translate('accountRecoveryInfo')}
      </Modal.Body>
    </Modal>
  );
};
