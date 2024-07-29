import styled from 'styled-components';
import starknetSrc from 'assets/images/starknet-logo.svg';
import { Button } from 'components/ui/atom/Button';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.palette.grey.white};
  width: ${(props) => props.theme.modal.base};
  padding: ${(props) => props.theme.spacing.base};
  padding-top: 40px;
  border-radius: 8px;
  align-items: center;
`;

export const StarknetLogo = styled.img.attrs(() => ({
  src: starknetSrc,
}))`
  width: 158px;
  height: 32px;
  margin-bottom: 32px;
`;

export const Title = styled.div`
  text-align: center;
  font-weight: ${(props) => props.theme.typography.h3.fontWeight};
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  line-height: ${(props) => props.theme.typography.h3.lineHeight};
  margin-bottom: 8px;
`;

export const Description = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
`;

export const DescriptionCentered = styled(Description)`
  text-align: center;
  width: 264px;
`;

export const Txnlink = styled.div`
  margin-top: 12px;
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.primary.main};
  font-weight: ${(props) => props.theme.typography.bold.fontWeight};
  font-family: ${(props) => props.theme.typography.bold.fontFamily};
  text-decoration: underline;
  cursor: pointer;
`;

export const DeployButton = styled(Button).attrs((props) => ({
  textStyle: {
    fontSize: props.theme.typography.p1.fontSize,
    fontWeight: 900,
  },
  upperCaseOnly: false,
  backgroundTransparent: true,
}))`
  box-shadow: 0px 14px 24px -6px rgba(106, 115, 125, 0.2);
  padding-top: 16px;
  padding-bottom: 16px;
`;
