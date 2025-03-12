import { MIN_METAMASK_VERSION } from 'utils/constants';
import { useMultiLanguage } from 'services';
import { Modal } from 'components/ui/atom/Modal';

export const MinMetamaskVersionModalView = () => {
  const { translate } = useMultiLanguage();

  return (
    <Modal>
      <Modal.Logo />
      <Modal.Title>{translate('metaMaskUpgradeNeeded')}</Modal.Title>
      <Modal.Body>
        {translate('updateMetaMaskVersion', MIN_METAMASK_VERSION)}
      </Modal.Body>
      <a href="https://metamask.io" target="_blank" rel="noreferrer">
        <Modal.Button onClick={() => {}}>
          {translate('goToMetaMaskWebsite')}
        </Modal.Button>
      </a>
    </Modal>
  );
};
