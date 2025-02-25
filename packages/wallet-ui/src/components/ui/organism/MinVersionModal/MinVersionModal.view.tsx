import {
  Description,
  StarknetLogo,
  Title,
  Wrapper,
} from './MinVersionModal.style';
import { useMultiLanguage } from 'services';

export const MinVersionModalView = () => {
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
