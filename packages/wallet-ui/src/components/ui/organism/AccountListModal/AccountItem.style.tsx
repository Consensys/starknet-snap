import styled from 'styled-components';
import { AccountImage } from 'components/ui/atom/AccountImage';

export const Wrapper = styled.div<{ selected: boolean; visible: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  opacity: ${(props) => (props.visible ? 1 : 0.5)};
  background-color: ${(props) =>
    props.selected ? props.theme.palette.grey.grey4 : 'transparent'};
  border-left: ${(props) =>
    props.selected
      ? `4px solid ${props.theme.palette.secondary.main}`
      : 'none'};
  padding-top: 14px;
  padding-bottom: 14px;
  padding-left: ${(props) => (props.selected ? '18px' : '22px')};
  padding-right: 14px;
  cursor: pointer;
`;

export const AccountDetailWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const AccountImageStyled = styled(AccountImage)`
  cursor: pointer;
`;
