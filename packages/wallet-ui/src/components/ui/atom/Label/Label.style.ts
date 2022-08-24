import styled from 'styled-components';

interface ILabel {
  error?: boolean;
}

export const Label = styled.span<ILabel>`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => (props.error ? props.theme.palette.error.main : props.theme.palette.grey.black)};
  font-weight: ${(props) => props.theme.typography.bold.fontWeight};
  font-family: ${(props) => props.theme.typography.bold.fontFamily};
  margin-bottom: ${(props) => props.theme.spacing.tiny2};
`;
