import { MIN_METAMASK_VERSION } from 'utils/constants';
import {
  Description,
  MetaMaskLogo,
  StarknetLogo,
  Title,
  Wrapper,
} from './MinMetamaskVersionModal.style';
import { ConnectButton } from '../ConnectModal/ConnectModal.style';
import { useMultiLanguage } from 'services';

export const MinMetamaskVersionModalView = () => {
  const { translate } = useMultiLanguage();

  return (
    <Wrapper>
      <StarknetLogo />
      <>
        <Title>{translate('metaMaskUpgradeNeeded')}</Title>
        <br />
        <Description>
          {translate('updateMetaMaskVersion', MIN_METAMASK_VERSION)}
        </Description>
        <br />
        <a href="https://metamask.io" target="_blank" rel="noreferrer">
          <ConnectButton customIconLeft={<MetaMaskLogo />} onClick={() => {}}>
            {translate('goToMetaMaskWebsite')}
          </ConnectButton>
        </a>
      </>
    </Wrapper>
  );
};
