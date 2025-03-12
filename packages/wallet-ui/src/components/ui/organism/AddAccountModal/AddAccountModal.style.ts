import styled from 'styled-components';
import { Button } from 'components/ui/atom/Button';

export const FormGroup = styled.div`
  margin: ${(props) => props.theme.spacing.tiny2} 0;
`;

export const ButtonStyled = styled(Button)`
  width: 152px;
`;

export const ErrorMsg = styled.div`
  text-align: center;
  color: ${(props) => props.theme.palette.error.main};
  font-size: ${(props) => props.theme.typography.c1.fontSize};
  font-weight: ${(props) => props.theme.typography.c1.fontSize};
  font-family: ${(props) => props.theme.typography.c1.fontFamily};
`;
