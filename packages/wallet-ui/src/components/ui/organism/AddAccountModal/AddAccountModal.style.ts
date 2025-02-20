import styled from 'styled-components';
import { Button } from 'components/ui/atom/Button';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: ${(props) => props.theme.modal.base};
  padding: ${(props) => props.theme.spacing.base};
  background-color: ${(props) => props.theme.palette.grey.white};
  border-radius: ${(props) => props.theme.corner.small};
`;

export const Title = styled.div`
  text-align: center;
  font-style: normal;
  font-weight: ${(props) => props.theme.typography.h3.fontWeight};
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  line-height: ${(props) => props.theme.typography.h3.lineHeight};
  color: ${(props) => props.theme.palette.primary.main};
  margin-bottom: ${(props) => props.theme.spacing.base};
`;

export const FormGroup = styled.div`
  margin: ${(props) => props.theme.spacing.tiny2} 0;
`;

export const ButtonStyled = styled(Button)`
  width: 152px;
`;

export const ButtonsWrapper = styled.div`
  padding: ${(props) => props.theme.spacing.base};
  gap: ${(props) => props.theme.spacing.base};
  display: flex;
  flex-direction: row;
`;

export const ErrorMsg = styled.div`
  text-align: center;
  color: ${(props) => props.theme.palette.error.main};
  font-size: ${(props) => props.theme.typography.c1.fontSize};
  font-weight: ${(props) => props.theme.typography.c1.fontSize};
  font-family: ${(props) => props.theme.typography.c1.fontFamily};
`;
