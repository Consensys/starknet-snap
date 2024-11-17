import {
  Description,
  StarknetLogo,
  Title,
  Wrapper,
} from './MinVersionModal.style';

export const MinVersionModalView = () => {
  return (
    <Wrapper>
      <StarknetLogo />
      <Title>A new version of the Starknet Snap is available</Title>
      <Description>
        To use this dApp, please:
        <ul>
          <li>
            Ensure you have the latest version of{' '}
            <a href="https://metamask.io">MetaMask</a> installed (v12.5 or
            higher is required).
          </li>
          <li>
            Install the latest version of the Starknet Snap by following these
            steps:
            <ul>
              <li>
                Remove the current version in MetaMask by navigating to{' '}
                <strong>
                  Settings {'>'} Snaps {'>'} @consensys/starknet-snap {'>'} See
                  Details {'>'} Remove Snap
                </strong>
                .
              </li>
              <li>Refresh the page.</li>
              <li>
                Click <strong>Connect</strong>, the new version will be proposed
                for installation.
              </li>
            </ul>
          </li>
        </ul>
        <p>
          <strong>Note</strong>: Your account will be automatically recovered,
          and future upgrades will be managed automatically.
        </p>
      </Description>
    </Wrapper>
  );
};
