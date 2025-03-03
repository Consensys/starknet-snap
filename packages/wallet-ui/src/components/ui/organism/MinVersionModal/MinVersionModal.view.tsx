import {
  Description,
  StarknetLogo,
  MetaMaskLogo,
  Title,
  Wrapper,
} from './MinVersionModal.style';

import { ConnectButton } from '../ConnectModal/ConnectModal.style';
import { useMultiLanguage, useStarkNetSnap } from 'services';

export const MinVersionModalView = () => {
  const { translate } = useMultiLanguage();
  const { completeUpgradeSnap } = useStarkNetSnap();
  return (
    <Wrapper>
      <StarknetLogo />
      <>
        <Title>{translate('newVersionAvailable')}</Title>

        <ConnectButton
          customIconLeft={<MetaMaskLogo />}
          onClick={completeUpgradeSnap}
        >
          {translate('upgrade')}
        </ConnectButton>
      </>
    </Wrapper>
  );
};
