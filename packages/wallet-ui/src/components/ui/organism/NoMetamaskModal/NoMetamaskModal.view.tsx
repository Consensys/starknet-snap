import { useMultiLanguage } from 'services';
import { Modal } from 'components/ui/atom/Modal';

export const NoMetamaskModalView = () => {
  const { translate } = useMultiLanguage();

  return (
    <Modal>
      <Modal.Logo />
      <Modal.Title>{translate('metaMaskExtensionRequired')}</Modal.Title>
      <Modal.Body>{translate('installMetaMaskToUseSnap')}</Modal.Body>
      <a href="https://metamask.io/" target="_blank" rel="noreferrer noopener">
        <Modal.Button onClick={() => {}}>
          {translate('downloadMetaMask')}
        </Modal.Button>
      </a>
    </Modal>
  );
};
