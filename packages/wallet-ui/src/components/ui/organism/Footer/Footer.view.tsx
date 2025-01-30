import { useMultiLanguage } from 'services';
import {
  MetamaskSnaps,
  PoweredBy,
  Wrapper,
  TandCWrapper,
  TandCLink,
  CopyText,
} from './Footer.style';

export const FooterView = () => {
  const currentYr = new Date().getFullYear();
  const { translate } = useMultiLanguage();

  return (
    <>
      <Wrapper>
        <PoweredBy>{translate('poweredBy')}</PoweredBy>
        <MetamaskSnaps>MetaMask Snaps</MetamaskSnaps>

        <TandCWrapper>
          <CopyText>&copy;{currentYr} Consensys</CopyText>
          <TandCLink href="https://consensys.io/terms-of-use" target="_blank">
            {translate('termsOfUse')}
          </TandCLink>
          <TandCLink href="https://consensys.io/privacy-policy" target="_blank">
            {translate('privacyPolicy')}
          </TandCLink>
        </TandCWrapper>
      </Wrapper>
    </>
  );
};
