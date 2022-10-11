import { ConnectButton, DescriptionCentered, FlaskIcon, StarknetLogo, Title, Wrapper } from './NoFlaskModal.style';
import { AlertView } from '../../atom/Alert/Alert.view';

export const NoFlaskModalView = () => {
  return (
    <Wrapper>
      <StarknetLogo />
      <Title>You don't have the MetaMask Flask extension</Title>
      <DescriptionCentered>
        You need to install MetaMask Flask extension in order to use the StarkNet Snap.
        <br />
        <br />
        <AlertView
          text="Please make sure that the regular MetaMask extension is disabled or use a different browser profile"
          variant="warning"
        />
      </DescriptionCentered>
      <a href="https://metamask.io/flask" target="_blank" rel="noreferrer noopener">
        <ConnectButton customIconLeft={<FlaskIcon />} onClick={() => {}}>
          Download MetaMask Flask
        </ConnectButton>
      </a>
    </Wrapper>
  );
};
