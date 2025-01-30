import {
  ConnectButton,
  DescriptionCentered,
  FlaskIcon,
  StarknetLogo,
  Title,
  Wrapper,
} from './NoFlaskModal.style';
import { AlertView } from '../../atom/Alert/Alert.view';
import { useMultiLanguage } from 'services';

export const NoFlaskModalView = () => {
  const { translate } = useMultiLanguage();

  return (
    <Wrapper>
      <StarknetLogo />
      <Title>{translate('metaMaskFlaskExtensionRequired')}</Title>
      <DescriptionCentered>
        {translate('installMetaMaskFlaskToUseSnap')}
        <br />
        <br />
        <AlertView
          text={translate('disableMetaMaskExtension')}
          variant="warning"
        />
      </DescriptionCentered>
      <a
        href="https://metamask.io/flask"
        target="_blank"
        rel="noreferrer noopener"
      >
        <ConnectButton customIconLeft={<FlaskIcon />} onClick={() => {}}>
          {translate('downloadMetaMaskFlask')}
        </ConnectButton>
      </a>
    </Wrapper>
  );
};
