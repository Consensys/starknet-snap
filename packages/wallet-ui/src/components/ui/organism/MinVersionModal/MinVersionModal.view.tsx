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
import { useMultiLanguage } from 'services';

export const MinVersionModalView = () => {
  const { metaMaskUpgradeRequired } = useHasMetamask();
  const { translate } = useMultiLanguage();

  return (
    <Wrapper>
      <StarknetLogo />
      {metaMaskUpgradeRequired ? (
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
      ) : (
        <>
          <Title>{translate('newVersionAvailable')}</Title>
          <Description>
            {translate('installLatestVersion')}
            <ul>
              <li>{translate('deleteCurrentVersionMetaMask')}</li>
              <li>{translate('refreshPage')}</li>
              <li>{translate('connectToMetaMask')}</li>
            </ul>
            {translate('accountRecoveryInfo')}
          </Description>
        </>
      )}
    </Wrapper>
  );
};
