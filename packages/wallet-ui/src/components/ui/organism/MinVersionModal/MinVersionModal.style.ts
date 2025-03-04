import styled from 'styled-components';
import starknetSrc from 'assets/images/starknet-logo.svg';
import metamaskSrc from 'assets/images/metamask-fox-icon.svg';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.palette.grey.white};
  width: ${(props) => props.theme.modal.base};
  padding: ${(props) => props.theme.spacing.base};
  padding-top: ${(props) => props.theme.spacing.large};
  border-radius: ${(props) => props.theme.spacing.base};
  align-items: center;
  a {
    all: unset;
  }
`;

export const StarknetLogo = styled.img.attrs(() => ({
  src: starknetSrc,
}))`
  height: ${(props) => props.theme.spacing.medium};
  margin-bottom: ${(props) => props.theme.spacing.medium};
`;

export const MetaMaskLogo = styled.img.attrs(() => ({
  src: metamaskSrc,
}))`
  width: ${(props) => props.theme.spacing.medium};
  height: ${(props) => props.theme.spacing.medium};
`;

export const Title = styled.div`
  text-align: center;
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-weight: ${(props) => props.theme.typography.h3.fontWeight};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  line-height: ${(props) => props.theme.typography.h3.lineHeight};
  margin-bottom: ${(props) => props.theme.spacing.base};
`;

export const Description = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
  margin-bottom: ${(props) => props.theme.spacing.base};
  text-align: center;
`;
