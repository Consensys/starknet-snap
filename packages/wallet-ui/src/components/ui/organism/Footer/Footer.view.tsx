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
  return (
    <>
      <Wrapper>
        <PoweredBy>Powered by </PoweredBy>
        <MetamaskSnaps>MetaMask Snaps</MetamaskSnaps>

        <TandCWrapper>
          <CopyText>&copy;{currentYr} Consensys</CopyText>
          <TandCLink href="https://consensys.io/terms-of-use" target="_blank">
            Terms of Use
          </TandCLink>
          <TandCLink href="https://consensys.io/privacy-policy" target="_blank">
            Privacy Policy
          </TandCLink>
        </TandCWrapper>
      </Wrapper>
    </>
  );
};
