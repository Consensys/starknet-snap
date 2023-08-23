import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  flex-wrap: wrap;
`;

export const PoweredBy = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  margin-right: ${(props) => props.theme.spacing.tiny2};
`;

export const MetamaskSnaps = styled.div`
  font-size: ${(props) => props.theme.typography.p1.fontSize};
  font-weight: ${(props) => props.theme.typography.bold.fontWeight};
  font-family: ${(props) => props.theme.typography.bold.fontFamily};
`;

export const TandCWrapper = styled.div`
  flex-basis: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -48px;
`;

export const CopyText = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
`;

export const TandCLink = styled.a`
  font-size: ${(props) => props.theme.typography.p1.fontSize};
  font-weight: ${(props) => props.theme.typography.bold.fontWeight};
  font-family: ${(props) => props.theme.typography.bold.fontFamily};
  margin-left: ${(props) => props.theme.spacing.tiny2};
  color: ${(props) => props.theme.palette.grey.black};
`;
