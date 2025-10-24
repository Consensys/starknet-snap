import { useMultiLanguage, useStarkNetSnap } from 'services';
import { SNAPS_DOC_URL } from 'utils/constants';

import { Modal } from 'components/ui/atom/Modal';
import {
  Description,
  ReadMore,
  WhatIsSnap,
  WhatIsSnapDiv,
} from './ConnectModal.style';

export const ConnectModalView = () => {
  const { connectToSnap } = useStarkNetSnap();
  const { translate } = useMultiLanguage();

  const handleReadMoreClick = () => {
    window.open(SNAPS_DOC_URL, '_blank')?.focus();
  };

  return (
    <Modal>
      <Modal.Logo />
      <Modal.Title>
        {translate('connectTo')} MetaMask
        <br />
        Starknet Snap
      </Modal.Title>
      <Modal.Body>
        {translate('starknetSnapInstallationPrompt')}

        <WhatIsSnapDiv>
          <WhatIsSnap>{translate('whatIsASnap')}</WhatIsSnap>
          <Description>{translate('snapsExtendMetaMask')}</Description>
          <ReadMore onClick={handleReadMoreClick}>
            {translate('readMore')}
          </ReadMore>
        </WhatIsSnapDiv>
      </Modal.Body>
      <Modal.Button onClick={connectToSnap}>
        {translate('connectWithMetaMask')}
      </Modal.Button>
    </Modal>
  );
};
