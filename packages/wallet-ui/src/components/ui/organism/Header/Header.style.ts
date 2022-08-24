import styled from 'styled-components';
import { Button } from 'components/ui/atom/Button';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.palette.grey.white};
  align-items: center;
  justify-content: center;
  box-shadow: ${(props) => props.theme.shadow.dividerBottom.boxShadow};
  padding-top: ${(props) => props.theme.spacing.large};
`;

export const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: ${(props) => props.theme.spacing.base};
  margin-bottom: ${(props) => props.theme.spacing.large};
`;

export const HeaderButton = styled(Button)`
  margin-right: ${(props) => props.theme.spacing.small};
`;
