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
  const handleUpdateMetaMask = () => {
    window.open('https://metamask.io')?.focus();
  };
  return (
    <Wrapper>
      <StarknetLogo />
      {metaMaskUpgradeRequired ? (
        <>
          <Title>An upgrade of MetaMask is needed to use this dApp</Title>
          <Description>
            To use this dApp, please:
            <ul>
              <li>
                Ensure you have the latest version of{' '}
                <a href="https://metamask.io">MetaMask</a> installed (v
                {MIN_METAMASK_VERSION} or higher is required).
              </li>
            </ul>
          </Description>
          <ConnectButton
            customIconLeft={<MetaMaskLogo />}
            onClick={handleUpdateMetaMask}
          >
            Upgrade your MetaMask
          </ConnectButton>
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
