import styled, { type DefaultTheme } from 'styled-components';

import starknetSrc from 'assets/images/starknet-logo.svg';
import metamaskSrc from 'assets/images/metamask-fox-icon.svg';

export type Size = {
  mr?: keyof DefaultTheme['spacing'];
  ml?: keyof DefaultTheme['spacing'];
  mb?: keyof DefaultTheme['spacing'];
  mt?: keyof DefaultTheme['spacing'];
};

const ImgLogo = styled.img<Size>`
  margin-right: ${(props) => props.theme.spacing[props.mr ?? 'none']};
  margin-left: ${(props) => props.theme.spacing[props.ml ?? 'none']};
  margin-bottom: ${(props) => props.theme.spacing[props.mb ?? 'none']};
  margin-top: ${(props) => props.theme.spacing[props.mt ?? 'none']};
`;

export const StarknetLogo = styled(ImgLogo).attrs(() => ({
  src: starknetSrc,
}))<Size>`
  height: ${(props) => props.theme.spacing.medium};
`;

export const MetaMaskLogo = styled(ImgLogo).attrs(() => ({
  src: metamaskSrc,
}))<Size>`
  width: ${(props) => props.theme.spacing.medium};
  height: ${(props) => props.theme.spacing.medium};
`;
