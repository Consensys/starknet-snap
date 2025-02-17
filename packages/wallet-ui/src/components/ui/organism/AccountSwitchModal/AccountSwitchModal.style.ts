import { AccountImage } from 'components/ui/atom/AccountImage';
import { Button } from 'components/ui/atom/Button';
import styled from 'styled-components';

export const MenuSection = styled.div`
  padding: 0px 10px;
  display: flex;
  flex-direction: column;
  height: 202;
  overflow-y: auto;
`;

export const Wrapper = styled(Button).attrs((props) => ({
  fontSize: props.theme.typography.c1.fontSize,
  upperCaseOnly: false,
  textStyle: {
    fontWeight: props.theme.typography.p1.fontWeight,
    fontFamily: props.theme.typography.p1.fontFamily,
  },
  iconStyle: {
    fontSize: props.theme.typography.i1.fontSize,
    color: props.theme.palette.grey.grey1,
  },
}))`
  padding: 4px 5px;
  height: 25px;
  color: ${(props) => props.theme.palette.grey.black};
  border-radius: 24px;
  border: 1px solid ${(props) => props.theme.palette.grey.grey3};

  :hover {
    background-color: ${(props) => props.theme.palette.grey.grey4};
    border: none;
  }
`;

export const Normal = styled.div`
  font-size: ${(props) => props.theme.typography.p1.fontSize};
`;

export const AccountSwitchMenuItem = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 14px;
  justify-content: space-between;
`;

export const AccountImageStyled = styled(AccountImage)`
  margin-left: ${(props) => props.theme.spacing.small};
  cursor: pointer;
`;

export const Container = styled.div`
  display: flex;
  alignitems: center;
`;

export const MenuItemText = styled.span`
  ${(props) => props.theme.typography.p2};
`;
