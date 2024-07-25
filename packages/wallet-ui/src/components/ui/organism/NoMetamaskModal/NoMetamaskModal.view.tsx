import {
  ConnectButton,
  DescriptionCentered,
  MetamaskIcon,
  StarknetLogo,
  Title,
  Wrapper,
} from './NoMetamaskModal.style';

export const NoMetamaskModalView = () => {
  return (
    <Wrapper>
      <StarknetLogo />
      <Title>You don't have the MetaMask extension</Title>
      <DescriptionCentered>
        You need to install MetaMask extension in order to use the Starknet
        Snap.
        <br />
        <br />
      </DescriptionCentered>
      <a href="https://metamask.io/" target="_blank" rel="noreferrer noopener">
        <ConnectButton customIconLeft={<MetamaskIcon />} onClick={() => {}}>
          Download MetaMask
        </ConnectButton>
      </a>
    </Wrapper>
  );
};
