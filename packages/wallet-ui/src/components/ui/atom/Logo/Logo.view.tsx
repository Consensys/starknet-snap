import type { DefaultTheme } from 'styled-components';

import { StarknetLogo, MetaMaskLogo, FlaskIcon } from './Logo.style';

export enum Variant {
  Starknet = 'starknet',
  MetaMask = 'metamask',
  Flask = 'flask',
}

export interface Props {
  variant?: Variant;
  mr?: keyof DefaultTheme['spacing'];
  ml?: keyof DefaultTheme['spacing'];
  mb?: keyof DefaultTheme['spacing'];
  mt?: keyof DefaultTheme['spacing'];
}

export const LogoView = (props: Props) => {
  const { variant, mb, ml, mr, mt } = props;
  switch (variant) {
    case Variant.Starknet:
      return <StarknetLogo mb={mb} ml={ml} mr={mr} mt={mt} />;
    case Variant.MetaMask:
      return <MetaMaskLogo mb={mb} ml={ml} mr={mr} mt={mt} />;
    case Variant.Flask:
      return <FlaskIcon mb={mb} ml={ml} mr={mr} mt={mt} />;
    default:
      return null;
  }
};
