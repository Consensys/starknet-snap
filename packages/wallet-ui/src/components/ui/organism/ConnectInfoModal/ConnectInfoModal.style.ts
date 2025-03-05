import styled from 'styled-components';

export const Bold = styled.div`
  font-size: ${(props) => props.theme.typography.p1.fontSize};
  font-weight: ${(props) => props.theme.typography.bold.fontWeight};
  font-family: ${(props) => props.theme.typography.bold.fontFamily};
`;

export const Normal = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
`;
