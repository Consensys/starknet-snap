import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
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
