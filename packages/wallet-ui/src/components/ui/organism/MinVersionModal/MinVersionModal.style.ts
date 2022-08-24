import styled from 'styled-components';
import starknetSrc from 'assets/images/starknet-logo.svg';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.palette.grey.white};
  width: ${(props) => props.theme.modal.base};
  padding: ${(props) => props.theme.spacing.base};
  padding-top: 40px;
  border-radius: 8px;
  align-items: center;
  a {
    all: unset;
  }
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
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-weight: ${(props) => props.theme.typography.h3.fontWeight};
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
  margin-bottom: 20px;
  width: 264px;
`;
