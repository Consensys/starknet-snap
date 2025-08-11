import styled from 'styled-components';

export const Txnlink = styled.div`
  margin-top: ${(props) => props.theme.spacing.small};
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.primary.main};
  font-weight: ${(props) => props.theme.typography.bold.fontWeight};
  font-family: ${(props) => props.theme.typography.bold.fontFamily};
  text-decoration: underline;
  cursor: pointer;
`;
