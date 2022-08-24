import { Description, StarknetLogo, Title, Wrapper } from './MinVersionModal.style';

export const MinVersionModalView = () => {
  return (
    <Wrapper>
      <StarknetLogo />
      <Title>A new version of the StarkNet Snap is available</Title>
      <Description>
        To use this dapp, please install the latest version by following those steps:
        <ul>
          <li>
            Delete the current version in MetaMask Flask by going in Settings {'>'} Snaps {'>'} @consensys/starknet-snap{' '}
            {'>'} See details {'>'} Remove Snap
          </li>
          <li>Refresh the page</li>
          <li>Click on connect, the new version will be proposed for installation.</li>
        </ul>
        Note: Your account will be automatically recovered. Future upgrades will be managed automatically
      </Description>
    </Wrapper>
  );
};
