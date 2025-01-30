import { useMultiLanguage, useStarkNetSnap } from 'services';
import { SNAPS_DOC_URL } from 'utils/constants';

import {
  ConnectButton,
  Description,
  DescriptionCentered,
  MetamaskIcon,
  ReadMore,
  StarknetLogo,
  Title,
  WhatIsSnap,
  WhatIsSnapDiv,
  Wrapper,
} from './ConnectModal.style';

export const ConnectModalView = () => {
  const { connectToSnap } = useStarkNetSnap();
  const { translate } = useMultiLanguage();

  const handleReadMoreClick = () => {
    window.open(SNAPS_DOC_URL, '_blank')?.focus();
  };

  return (
    <Wrapper>
      <StarknetLogo />
      <Title>
        {translate('connectTo')} MetaMask
        <br />
        Starknet Snap
      </Title>
      <DescriptionCentered>
        {translate('starknetSnapInstallationPrompt')}
      </DescriptionCentered>
      <WhatIsSnapDiv>
        <WhatIsSnap>{translate('whatIsASnap')}</WhatIsSnap>
        <Description>{translate('snapsExtendMetaMask')}</Description>
        <ReadMore onClick={handleReadMoreClick}>
          {translate('readMore')}
        </ReadMore>
      </WhatIsSnapDiv>
      <ConnectButton customIconLeft={<MetamaskIcon />} onClick={connectToSnap}>
        {translate('connectWithMetaMask')}
      </ConnectButton>
    </Wrapper>
  );
};
