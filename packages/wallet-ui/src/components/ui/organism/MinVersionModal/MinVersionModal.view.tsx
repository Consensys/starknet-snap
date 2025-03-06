import {
  StarknetLogo,
  MetaMaskLogo,
  Title,
  Wrapper,
  Description,
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
        <Description>{translate('upgradeLatestSnapVersion')}</Description>
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
