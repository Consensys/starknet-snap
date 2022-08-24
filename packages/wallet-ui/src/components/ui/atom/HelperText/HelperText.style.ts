import styled from 'styled-components';

export const HelperText = styled.span`
  font-size: ${(props) => props.theme.typography.c1.fontSize};
  color: ${(props) => props.theme.palette.error.main};
  padding-top: ${(props) => props.theme.spacing.tiny};
  padding-left: ${(props) => props.theme.spacing.small};
`;
