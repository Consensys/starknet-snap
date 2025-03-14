import styled from 'styled-components';
import { Alert } from 'components/ui/atom/Alert';
import { Button } from 'components/ui/atom/Button';

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

export const ButtonStyled = styled(Button)`
  width: 152px;
`;
