import { useMultiLanguage } from 'services';
import {
  ConnectButton,
  DescriptionCentered,
  MetamaskIcon,
  StarknetLogo,
  Title,
  Wrapper,
} from './NoMetamaskModal.style';

export const NoMetamaskModalView = () => {
  const { translate } = useMultiLanguage();

  return (
    <Wrapper>
      <StarknetLogo />
      <Title>{translate('metaMaskExtensionRequired')}</Title>
      <DescriptionCentered>
        {translate('installMetaMaskToUseSnap')}
        <br />
        <br />
      </DescriptionCentered>
      <a href="https://metamask.io/" target="_blank" rel="noreferrer noopener">
        <ConnectButton customIconLeft={<MetamaskIcon />} onClick={() => {}}>
          {translate('downloadMetaMask')}
        </ConnectButton>
      </a>
    </Wrapper>
  );
};
