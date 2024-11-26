import { MIN_METAMASK_VERSION } from 'utils/constants';
import {
  Description,
  MetaMaskLogo,
  StarknetLogo,
  Title,
  Wrapper,
} from './MinVersionModal.style';
import { useHasMetamask } from 'hooks/useHasMetamask';
import { ConnectButton } from '../ConnectModal/ConnectModal.style';

export const MinVersionModalView = () => {
  const { metaMaskUpgradeRequired } = useHasMetamask();
  return (
    <Wrapper>
      <StarknetLogo />
      {metaMaskUpgradeRequired ? (
        <>
          <Title>An upgrade of MetaMask is needed to use this dApp</Title>
          <br />
          <Description>
            Please update to MetaMask Version {MIN_METAMASK_VERSION} or higher.
          </Description>
          <br />
          <a href="https://metamask.io" target="_blank" rel="noreferrer">
            <ConnectButton customIconLeft={<MetaMaskLogo />} onClick={() => {}}>
              Go to MetaMask Website 
            </ConnectButton>
          </a>
        </>
      ) : (
        <>
          <Title>A new version of the Starknet Snap is available</Title>
          <Description>
            To use this dapp, please install the latest version by following
            those steps:
            <ul>
              <li>
                Delete the current version in MetaMask by going in Settings{' '}
                {'>'} Snaps {'>'} @consensys/starknet-snap {'>'} See details{' '}
                {'>'} Remove Snap
              </li>
              <li>Refresh the page</li>
              <li>
                Click on connect, the new version will be proposed for
                installation.
              </li>
            </ul>
            Note: Your account will be automatically recovered. Future upgrades
            will be managed automatically
          </Description>
        </>
      )}
    </Wrapper>
  );
};
