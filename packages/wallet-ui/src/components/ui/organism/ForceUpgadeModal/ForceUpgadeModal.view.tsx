import {
  Description,
  StarknetLogo,
  Title,
  Wrapper,
} from './ForceUpgadeModal.style';
import { useMultiLanguage } from 'services';

export const ForceUpgadeModalView = () => {
  const { translate } = useMultiLanguage();

  return (
    <Wrapper>
      <StarknetLogo />
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
    </Wrapper>
  );
};
