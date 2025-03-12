import { Modal } from 'components/ui/atom/Modal';
import { useMultiLanguage, useStarkNetSnap } from 'services';

export const MinVersionModalView = () => {
  const { translate } = useMultiLanguage();
  const { completeUpgradeSnap } = useStarkNetSnap();

  return (
    <Modal>
      <Modal.Logo />
      <Modal.Title>{translate('newVersionAvailable')}</Modal.Title>
      <Modal.Body>{translate('upgradeLatestSnapVersion')}</Modal.Body>
      <Modal.Button onClick={completeUpgradeSnap}>
        {translate('upgrade')}
      </Modal.Button>
    </Modal>
  );
};
