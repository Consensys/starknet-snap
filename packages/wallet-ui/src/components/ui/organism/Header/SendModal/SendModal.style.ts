import styled from 'styled-components';
import { Alert } from 'components/ui/atom/Alert';
import { Button } from 'components/ui/atom/Button';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.palette.grey.white};
  width: ${(props) => props.theme.modal.base};
  padding: ${(props) => props.theme.spacing.base};
  border-radius: 8px 8px 0px 0px;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-bottom: ${(props) => props.theme.spacing.base};
`;

export const Title = styled.div`
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-weight: ${(props) => props.theme.typography.h3.fontWeight};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  width: 100%;
  text-align: center;
`;

export const Network = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.small};
`;

export const SeparatorSmall = styled.div`
  width: 100%;
  margin-bottom: ${(props) => props.theme.spacing.small};
`;

export const Separator = styled.div`
  width: 100%;
  margin-bottom: ${(props) => props.theme.spacing.base};
`;

export const MessageAlert = styled(Alert)``;

export const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  width: ${(props) => props.theme.modal.base};
  background-color: ${(props) => props.theme.palette.grey.white};
  border-radius: 0px 0px 8px 8px;
  box-shadow: inset 0px 1px 0px rgba(212, 212, 225, 0.4);
`;

export const ButtonStyled = styled(Button)`
  width: 152px;
`;
