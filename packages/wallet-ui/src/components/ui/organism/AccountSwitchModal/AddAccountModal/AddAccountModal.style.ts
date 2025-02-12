import styled from 'styled-components';
import { Button } from 'components/ui/atom/Button';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: ${(props) => props.theme.modal.base};
  padding: ${(props) => props.theme.spacing.base};
  background-color: ${(props) => props.theme.palette.grey.white};
  border-radius: 8px 8px 0px 0px;
`;
export const Title = styled.div`
  text-align: center;
  font-style: normal;
  font-weight: ${(props) => props.theme.typography.h3.fontWeight};
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  line-height: ${(props) => props.theme.typography.h3.lineHeight};
  color: ${(props) => props.theme.palette.primary.main};
  margin-bottom: 24px;
`;

export const FormGroup = styled.div`
  margin: 8px 0;
`;
export const Space = styled.div`
  margin-top: 1.1rem;
`;

export const ButtonStyled = styled(Button)`
  width: 152px;
`;

export const ButtonsWrapper = styled.div`
  background-color: ${(props) => props.theme.palette.grey.white};
  padding: ${(props) => props.theme.spacing.base};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  box-shadow: inset 0px 1px 0px rgba(212, 212, 225, 0.4);
  border-radius: 0px 0px 8px 8px;
  width: ${(props) => props.theme.modal.base};
`;
