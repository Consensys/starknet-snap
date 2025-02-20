import styled from 'styled-components';
import { AccountImage } from 'components/ui/atom/AccountImage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const Wrapper = styled.div<{ selected: boolean; visible: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  opacity: ${(props) => (props.visible ? 1 : 0.5)};
  background-color: ${(props) =>
    props.selected ? props.theme.palette.grey.grey4 : 'transparent'};
  border-left: ${(props) =>
    props.selected
      ? `${props.theme.spacing.tiny} solid ${props.theme.palette.secondary.main}`
      : `${props.theme.spacing.tiny} solid ${props.theme.palette.secondary.contrastText}`};
  padding: ${(props) => props.theme.spacing.small};
  cursor: pointer;
`;

export const AccountInfoWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const AccountImageStyled = styled(AccountImage)`
  cursor: pointer;
`;

export const VisibilityIcon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.palette.grey.grey1};
`;
